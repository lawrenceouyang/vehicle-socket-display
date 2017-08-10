from django.shortcuts import render, redirect
from admin_portal.views.login import login_required
from django.core.urlresolvers import reverse
from django.conf import settings
import requests
from django.http import HttpResponseNotAllowed, JsonResponse
from admin_portal.views.error import validate_api_call
from admin_portal.views.provider import get_user_role_id
import json


import logging

logger = logging.getLogger(__name__)


@login_required
def activity(request, headers):
    if request.method == "GET":
        return render(request, "admin_portal/main/activity.html", "")
    else:
        return HttpResponseNotAllowed(['GET'])


@login_required
def audit_trail(request, headers):
    if request.method == "GET":
        return render(request, "admin_portal/main/audit.html", "")
    else:
        return HttpResponseNotAllowed(['GET'])


@login_required
def admin_audit_trail(request, admin_id, headers):
    if request.method == "GET":
        return render(request, "admin_portal/main/audit_admin.html", "")
    else:
        return HttpResponseNotAllowed(['GET'])


@login_required
def provider_audit_trail(request, provider_id, headers):
    if request.method == "GET":
        response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), headers=headers)
        validate_api_call(response, [])
        provider = json.loads(response.text)['companies'][0]
        return render(request, "admin_portal/main/audit_provider.html", {"provider": provider})
    else:
        return HttpResponseNotAllowed(['GET'])


@login_required
def get_provider_activity(request, provider_id, headers):

    if request.method == "GET":
        params = {"action_by_user_role_id": get_user_role_id(headers, "superuser")}
        params['company_id'] = provider_id
        response = requests.get("{}/audit".format(settings.ADMIN_WS_URL), params=params, headers=headers)
        validate_api_call(response, [])
        audits = json.loads(response.text)['audit_entries']
        return JsonResponse(audits, safe=False)
    else:
        return HttpResponseNotAllowed(['GET'])


@login_required
def get_admin_activity(request, headers):
    if request.method == "GET":
        params = {"action_by_user_role_id": request.session['role_id']}
        response = requests.get("{}/audit".format(settings.ADMIN_WS_URL), params=params, headers=headers)
        validate_api_call(response, [])
        audits = json.loads(response.text)['audit_entries']
        return JsonResponse(audits, safe=False)
    else:
        return HttpResponseNotAllowed(['GET'])

@login_required
def get_coordinator_activity(request, headers):
    if request.method == "GET":

        # First get the audits (logins/logouts) for all the coordinator users
        params = {"action_by_user_role_id": get_user_role_id(headers, "coordinator_user")}
        response = requests.get("{}/audit".format(settings.ADMIN_WS_URL), params=params, headers=headers)
        validate_api_call(response, [])
        user_audits = json.loads(response.text)['audit_entries']

        # Next get the audits (logins/logouts) for all the admins
        params = {"action_by_user_role_id": get_user_role_id(headers, "coordinator_admin")}
        response = requests.get("{}/audit".format(settings.ADMIN_WS_URL), params=params, headers=headers)
        validate_api_call(response, [])
        admin_audits = json.loads(response.text)['audit_entries']

        return JsonResponse(user_audits+admin_audits, safe=False)
    else:
        return HttpResponseNotAllowed(['GET'])

@login_required
def get_all_provider_activity(request, headers):
    if request.method == "GET":
        params = {"action_by_user_role_id": get_user_role_id(headers, "superuser")}
        response = requests.get("{}/audit".format(settings.ADMIN_WS_URL), params=params, headers=headers)
        validate_api_call(response, [])
        audits = json.loads(response.text)['audit_entries']
        return JsonResponse(audits, safe=False)
    else:
        return HttpResponseNotAllowed(['GET'])





