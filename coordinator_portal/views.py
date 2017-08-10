from django.shortcuts import render
from django.http import JsonResponse
import json
import logging

logger = logging.getLogger(__name__)


def login(request):
    return render(request, "coordinator_portal/login.html", "")


def app(request):
    return render(request, "coordinator_portal/app.html", "")

