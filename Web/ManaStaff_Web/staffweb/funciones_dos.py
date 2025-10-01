import re
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST,require_GET
from requests.exceptions import HTTPError
from datetime import datetime, timedelta
from django.http import JsonResponse

from .firebase import authP, auth, database, storage, db

def funcion_dos(request):
    pass