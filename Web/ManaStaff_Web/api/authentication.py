from rest_framework import authentication, exceptions
from staffweb.firebase import auth as firebase_auth

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()
        if not auth_header or auth_header[0].lower() != b'bearer':
            return None

        if len(auth_header) != 2:
            raise exceptions.AuthenticationFailed('Token inválido o malformado.')

        token = auth_header[1].decode()
        try:
            decoded_token = firebase_auth.verify_id_token(token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Error al verificar token: {str(e)}')

        return (decoded_token, None)
