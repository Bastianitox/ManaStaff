/*  Paginación */
const PAGE_SIZE = 6;      
let CURRENT_PAGE = 1;     
let TOTAL_PAGES = 1;

const $pgPrevAll = Array.from(document.querySelectorAll('[data-pg="prev"]'));
const $pgNextAll = Array.from(document.querySelectorAll('[data-pg="next"]'));
const $pgInfoAll = Array.from(document.querySelectorAll('[data-pg="info"]'));

function updatePagerUI() {
  $pgInfoAll.forEach(el => el.textContent = `Página ${CURRENT_PAGE} de ${TOTAL_PAGES}`);
  const prevDisabled = CURRENT_PAGE <= 1;
  const nextDisabled = CURRENT_PAGE >= TOTAL_PAGES;
  $pgPrevAll.forEach(btn => btn.disabled = prevDisabled);
  $pgNextAll.forEach(btn => btn.disabled = nextDisabled);
}

/* Helpers  */

// CSRF 
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}

// Solo dígitos
function onlyDigits(v) {
  return String(v || '').replace(/\D+/g, '');
}

// Formato simple de RUT
function formatearRut(rut) {
  const s = onlyDigits(rut);
  if (!s) return rut || '';
  let cuerpo = s.slice(0, -1);
  const dv = s.slice(-1);
  let out = '';
  while (cuerpo.length > 3) {
    out = '.' + cuerpo.slice(-3) + out;
    cuerpo = cuerpo.slice(0, -3);
  }
  return cuerpo + out + '-' + dv;
}

function toggleSpinner(show) {
  const sp = document.getElementById('loadingSpinner');
  if (!sp) return;
  sp.classList[show ? 'remove' : 'add']('hidden');
}

/* Estado y refs */

let LISTA_USUARIOS = [];    
let FILTRO_TEXTO = '';
let FILTRO_RUT_DIGITS = ''; 
let userToDisable = null;   

// RUT actual para evitar auto-deshabilitarse
const CURRENT_USER_RUT = window.currentUserRut || '';

// Refs DOM
const $tbody = document.getElementById('usersTableBody');
const $buscador = document.getElementById('searchInput');

// Botón "Crear usuario"
const $btnCrear = document.getElementById('createUserBtn') || document.getElementById('btnCrearUsuario');
// URL de edición desde el atributo data-edit-url del tbody
const EDIT_URL_BASE = ($tbody && $tbody.dataset && $tbody.dataset.editUrl) ? $tbody.dataset.editUrl : '/modificar_usuario';
// URL de creación
const CREATE_URL = ($btnCrear && $btnCrear.dataset && $btnCrear.dataset.createUrl)
  ? $btnCrear.dataset.createUrl
  : (window.CREATE_USER_URL || '/crear_usuario');

// Modales
const $modalDisable = document.getElementById('disableModal');
const $txtDisableReason = document.getElementById('disableReason');
const $btnDisableCancel = document.getElementById('disableCancelBtn');
const $btnDisableConfirm = document.getElementById('disableConfirmBtn');

const $modalDetail = document.getElementById('detailModal');
const $detailBody = document.getElementById('detailBody');
const $detailCloseBtn = document.getElementById('detailCloseBtn');

/* Init  */

document.addEventListener('DOMContentLoaded', () => {
  // Buscador
  if ($buscador) {
    $buscador.addEventListener('input', () => {
      FILTRO_TEXTO = ($buscador.value || '').trim().toLowerCase();
      FILTRO_RUT_DIGITS = onlyDigits($buscador.value || ''); 
      CURRENT_PAGE = 1; 
      renderTabla();
    });
  }

  // Botón crear usuario
  if ($btnCrear) {
    $btnCrear.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = CREATE_URL;
    });
  }

  // Listeners de todos los paginadores
  $pgPrevAll.forEach(btn => btn.addEventListener('click', () => {
    if (CURRENT_PAGE > 1) {
      CURRENT_PAGE -= 1;
      renderTabla();
    }
  }));
  $pgNextAll.forEach(btn => btn.addEventListener('click', () => {
    if (CURRENT_PAGE < TOTAL_PAGES) {
      CURRENT_PAGE += 1;
      renderTabla();
    }
  }));

  // Modal deshabilitar
  if ($btnDisableCancel) $btnDisableCancel.addEventListener('click', () => {
    userToDisable = null;
    if ($modalDisable) $modalDisable.classList.add('hidden');
  });

  if ($btnDisableConfirm) $btnDisableConfirm.addEventListener('click', () => {
    const reason = ($txtDisableReason?.value || '').trim();
    if (reason.length < 5) {
      alert('Debe indicar un motivo (mínimo 5 caracteres).');
      return;
    }
    if (!userToDisable) return;

    toggleSpinner(true);
    fetch(`/deshabilitar_usuario/${userToDisable}`, {
      method: 'POST',
      headers: { 'X-CSRFToken': getCookie('csrftoken'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ detalle: reason })
    })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          alert('Usuario deshabilitado.');
          obtener_usuarios();
        } else {
          alert('Error: ' + (data.message || data.mensaje || 'No fue posible deshabilitar.'));
        }
      })
      .catch(err => console.error(err))
      .finally(() => {
        userToDisable = null;
        if ($modalDisable) $modalDisable.classList.add('hidden');
        toggleSpinner(false);
      });
  });

  // Modal detalle
  if ($detailCloseBtn) $detailCloseBtn.addEventListener('click', () => {
    if ($modalDetail) $modalDetail.classList.add('hidden');
  });

  // Textarea sin redimensionar
  if ($txtDisableReason) {
    $txtDisableReason.style.resize = 'none';
    $txtDisableReason.style.minHeight = '120px';
    $txtDisableReason.style.maxHeight = '220px';
  }

  // Cargar datos
  obtener_usuarios();
});

function obtener_usuarios() {
  toggleSpinner(true);
  fetch('/obtener_usuarios')
    .then(r => r.json())
    .then(data => {
      LISTA_USUARIOS = Array.isArray(data?.usuarios) ? data.usuarios : [];
      CURRENT_PAGE = 1; 
      renderTabla();   
    })
    .catch(err => {
      console.error('Error al obtener usuarios:', err);
      LISTA_USUARIOS = [];
      renderTabla();
    })
    .finally(() => toggleSpinner(false));
}

/*Render tabla*/

function renderTabla() {
  if (!$tbody) return;

  //Copia, filtra y ordena (más recientes primero)
  let data = LISTA_USUARIOS.slice();

  if (FILTRO_TEXTO || FILTRO_RUT_DIGITS) {
    data = data.filter(u => {
      const hay = [
        u.name || '',
        u.email || '',
        u.position || '',
        (u.rut_normal || u.rut || '')
      ].join(' ').toLowerCase();

      const matchTexto = FILTRO_TEXTO ? hay.includes(FILTRO_TEXTO) : true;

      const rutDigits = onlyDigits(u.rut_normal || u.rut || '');
      const matchRut = FILTRO_RUT_DIGITS ? rutDigits.includes(FILTRO_RUT_DIGITS) : true;

      return matchTexto && matchRut;
    });
  }

  data.sort((a, b) => String(b.sortDate || '').localeCompare(String(a.sortDate || '')));

  //Paginación
  TOTAL_PAGES = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  if (CURRENT_PAGE > TOTAL_PAGES) CURRENT_PAGE = TOTAL_PAGES;

  const start = (CURRENT_PAGE - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = data.slice(start, end);

  //Render de filas
  $tbody.innerHTML = '';
  const frag = document.createDocumentFragment();

  pageItems.forEach(user => {
    const row = document.createElement('tr');

    const isCurrentUser = (user.rut || user.rut_normal || '').toString() === (CURRENT_USER_RUT || '').toString();
    const disabledAttr = isCurrentUser ? 'disabled' : '';
    const actionsHtml = user.is_disabled
      ? `
    <button class="action-btn" onclick="enableUser(${onlyDigits(user.rut || user.rut_normal)})" title="Habilitar" ${disabledAttr}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>
      Habilitar
    </button>
    <button class="action-btn" onclick="showDisableDetail(${onlyDigits(user.rut || user.rut_normal)})" title="Ver detalle">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M11,11V17H13V11H11M11,7V9H13V7H11Z"/></svg>
      Detalle
    </button>
  `
      : `
    <button class="action-btn" onclick="editUser(${onlyDigits(user.rut || user.rut_normal)})" title="Modificar usuario" ${disabledAttr}>
      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>
      Modificar
    </button>
    <button class="action-btn delete-btn" onclick="askDisable(${onlyDigits(user.rut || user.rut_normal)})" title="Deshabilitar usuario" ${disabledAttr}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7,9H17V11H7V9M7,13H14V15H7V13Z"/></svg>
      Deshabilitar
    </button>
  `;

    row.innerHTML = `
      <td>${user.rut_normal || formatearRut(user.rut) || ''}</td>
      <td>${user.name || ''}</td>
      <td>${user.email || ''}</td>
      <td>${user.position || ''}</td>
      <td title="${user.email_verificado ? 'Verificado' : 'Sin verificar'}">${user.email_verificado ? '✔' : '✖'}</td>
      <td>${user.createdDate || ''}</td>
      <td>${user.Ultimo_login || ''}</td>
      <td>${actionsHtml}</td>
    `;

    frag.appendChild(row);
  });

  $tbody.appendChild(frag);

  //Actualizar todos los paginadores
  updatePagerUI();
}

//Acciones

// Abrir modal “Deshabilitar”
function askDisable(userId) {
  if (onlyDigits(userId) === onlyDigits(CURRENT_USER_RUT)) {
    alert('No puede deshabilitar su propio usuario.');
    return;
  }
  userToDisable = String(userId);
  if ($txtDisableReason) {
    $txtDisableReason.value = '';
    $txtDisableReason.style.resize = 'none';
  }
  if ($modalDisable) $modalDisable.classList.remove('hidden');
}

// POST habilitar
function enableUser(userId) {
  if (!confirm('¿Habilitar a este usuario?')) return;
  toggleSpinner(true);
  fetch(`/habilitar_usuario/${userId}`, {
    method: 'POST',
    headers: { 'X-CSRFToken': getCookie('csrftoken') }
  })
    .then(r => r.json())
    .then(data => {
      if (data.status === 'success') {
        alert('Usuario habilitado.');
        obtener_usuarios();
      } else {
        alert('Error: ' + (data.message || data.mensaje || 'No fue posible habilitar.'));
      }
    })
    .catch(err => console.error(err))
    .finally(() => toggleSpinner(false));
}

// GET detalle deshabilitación
function showDisableDetail(userId) {
  fetch(`/detalle_usuario_deshabilitado/${userId}`)
    .then(r => r.json())
    .then(data => {
      if (data.status !== 'success') {
        alert('No fue posible obtener el detalle.');
        return;
      }
      if ($detailBody) {
        $detailBody.innerHTML = `
          <p><strong>RUT:</strong> ${formatearRut(userId)}</p>
          <p><strong>Fecha deshabilitación:</strong> ${data.fecha || ''}</p>
          <p style="margin-top:10px"><strong>Motivo:</strong><br>${(data.detalle || '').replace(/\n/g, '<br>')}</p>
        `;
      }
      if ($modalDetail) $modalDetail.classList.remove('hidden');
    })
    .catch(err => console.error(err));
}

// Editar
function editUser(userId) {
  const url = `${EDIT_URL_BASE}?id=${userId}`;
  window.location.href = url;
}

window.askDisable = askDisable;
window.enableUser = enableUser;
window.showDisableDetail = showDisableDetail;
window.editUser = editUser;