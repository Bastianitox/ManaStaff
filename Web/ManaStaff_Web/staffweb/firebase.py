import pyrebase
import firebase_admin
import os
from firebase_admin import credentials, auth, db, storage

certificados = 'staffweb/static/staffweb/xe/manastaff-7ef1d-firebase-adminsdk-fbsvc-3701fef0de.json'

firebase_config = {
    "apiKey": "AIzaSyDrogTFQNg_BNb1qmkIhJ6cpppzPw-DLOo",
    "authDomain": "manastaff-7ef1d.firebaseapp.com",
    "databaseURL": "https://manastaff-7ef1d-default-rtdb.firebaseio.com",
    "projectId": "manastaff-7ef1d",
    "storageBucket":  "manastaff-7ef1d.appspot.com"
}
firebase = pyrebase.initialize_app(firebase_config)
authP = firebase.auth()
database = firebase.database()
storageP = firebase.storage()   

cred = credentials.Certificate(certificados)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://manastaff-7ef1d-default-rtdb.firebaseio.com",
        "storageBucket": "manastaff-7ef1d.appspot.com",
    })
