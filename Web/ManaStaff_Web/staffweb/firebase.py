import pyrebase
import firebase_admin
from firebase_admin import credentials, auth, db, storage

certificados = 'staffweb/static/staffweb/xe/manastaff-7ef1d-firebase-adminsdk-fbsvc-075d54f81b.json'

# --- Pyrebase (cliente) ---
firebase_config = {
    "apiKey": "AIzaSyDrogTFQNg_BNb1qmkIhJ6cpppzPw-DLOo",
    "authDomain": "manastaff-7ef1d.firebaseapp.com",
    "databaseURL": "https://manastaff-7ef1d-default-rtdb.firebaseio.com",
    "projectId": "manastaff-7ef1d",
    "storageBucket": "manastaff-7ef1d.firebasestorage.app",
    "messagingSenderId": "409038016605",
    "appId": "1:409038016605:web:0ff9ded9533dcc28c1fdb4",
}
firebase = pyrebase.initialize_app(firebase_config)
authP = firebase.auth()
database = firebase.database()
storageP = firebase.storage()   

# --- Firebase Admin (servidor) ---
cred = credentials.Certificate(certificados)

# 👇 evitar inicialización múltiple
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://manastaff-7ef1d-default-rtdb.firebaseio.com",
        "storageBucket": "manastaff-7ef1d.appspot.com" 
    })

authA = auth
dbA = db
storageA = storage