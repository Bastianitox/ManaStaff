from firebase_admin import credentials, db, storage
import firebase_admin
from pyrebase import pyrebase
import os
certificados = 'staffweb/static/staffweb/xe/manastaff-7ef1d-firebase-adminsdk-fbsvc-075d54f81b.json'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = certificados

firebaseConfig = {
    "apiKey": "AIzaSyDrogTFQNg_BNb1qmkIhJ6cpppzPw-DLOo",
    "authDomain": "manastaff-7ef1d.firebaseapp.com",
    "databaseURL": "https://manastaff-7ef1d-default-rtdb.firebaseio.com",
    "projectId": "manastaff-7ef1d",
    "storageBucket": "manastaff-7ef1d.firebasestorage.app",
    "messagingSenderId": "409038016605",
    "appId": "1:409038016605:web:0ff9ded9533dcc28c1fdb4",
    "measurementId": "G-4WCLGFHBH1",
    "serviceAccount": certificados
}

cred = credentials.Certificate(certificados)

application = firebase_admin.initialize_app(cred, {
    "databaseURL": "https://manastaff-7ef1d-default-rtdb.firebaseio.com",
    "storageBucket": "manastaff-7ef1d.firebasestorage.app",
})

firebase = pyrebase.initialize_app(firebaseConfig)