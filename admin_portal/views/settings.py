from django.shortcuts import render, redirect
from admin_portal.views.login import login_required
from django.core.urlresolvers import reverse
from django.conf import settings
from django.contrib import messages
import requests
from admin_portal.views.error import validate_api_call
from admin_portal.views.provider import create_audit
import json
from datetime import datetime

import logging

logger = logging.getLogger(__name__)


@login_required
def configuration(request, headers):

    # GET the Settings page
    if request.method == "GET":

        # Get a list of all destinations
        response = requests.get("{}/config".format(settings.ADMIN_WS_URL), headers=headers)
        validate_api_call(response, [])
        config = json.loads(response.text)['configs']

        configs = {}

        for item in config:
            if item['property'] == "display_message":
                configs['empty_message'] = item['value']
            elif item['property'] == "display_contact_message":
                configs['contact_message'] = item['value']
            elif item['property'] == "display_reset_time":
                reset_time = datetime.strptime(item['value'], "%H:%M")
                configs['reset_time_h'] = reset_time.strftime("%I")
                configs['reset_time_m'] = reset_time.strftime("%M")
                configs['reset_time_ampm'] = reset_time.strftime("%p")
            elif item['property'] == "display_start_time":
                start_time = datetime.strptime(item['value'], "%H:%M")
                configs['start_time_h'] = start_time.strftime("%I")
                configs['start_time_m'] = start_time.strftime("%M")
                configs['start_time_ampm'] = start_time.strftime("%p")
            elif item['property'] == "display_refresh_interval":
                configs['refresh_interval'] = item['value']
            elif item['property'] == "display_checkout_interval":
                configs['checkout_interval'] = item['value']

        return render(request, "admin_portal/main/settings.html", {"config": configs})

    elif request.method == "POST":

        data = json.loads(json.dumps(request.POST))

        # Get the old data
        response = requests.get("{}/config".format(settings.ADMIN_WS_URL), headers=headers)
        validate_api_call(response, [])
        config = json.loads(response.text)['configs']

        for item in config:

            # Update config items only if the data has changed

            # Display Message
            if item['property'] == "display_message":
                if item['value'] != data['display_message']:
                    response = requests.put("{}/config/property/{}".format(settings.ADMIN_WS_URL, "display_message"),

                                            data={"value": data['display_message']}, headers=headers)
                    validate_api_call(response, [])

            # Display Contact Message
            elif item['property'] == "display_contact_message":
                if item['value'] != data['display_contact_message']:
                    response = requests.put(
                        "{}/config/property/{}".format(settings.ADMIN_WS_URL, "display_contact_message"),

                        data={"value": data['display_contact_message']}, headers=headers)

                    validate_api_call(response, [])

            # Display Refresh Interval
            elif item['property'] == "display_refresh_interval":
                if item['value'] != data['display_refresh_interval']:
                    response = requests.put(
                        "{}/config/property/{}".format(settings.ADMIN_WS_URL, "display_refresh_interval"),
                        data={"value": data['display_refresh_interval']}, headers=headers)
                    validate_api_call(response, [])

            # Display Checkout Interval
            elif item['property'] == "display_checkout_interval":
                if item['value'] != data['display_checkout_interval']:
                    response = requests.put(
                        "{}/config/property/{}".format(settings.ADMIN_WS_URL, "display_checkout_interval"),
                        data={"value": data['display_checkout_interval']}, headers=headers)
                    validate_api_call(response, [])

            # Display Reset Time
            elif item['property'] == "display_reset_time":
                reset_time_12_hour = data['display_reset_time_h'] + ":" + data['display_reset_time_m'] + " " + data[
                    'display_reset_time_ampm']
                reset_time_12_hour = datetime.strptime(reset_time_12_hour, "%I:%M %p")
                if item['value'] != reset_time_12_hour:
                    response = requests.put("{}/config/property/{}".format(settings.ADMIN_WS_URL, "display_reset_time"),
                                            data={"value": reset_time_12_hour.strftime("%H:%M")}, headers=headers)
                    validate_api_call(response, [])

            # Display Start Time
            elif item['property'] == "display_start_time":

                start_time_12_hour = data['display_start_time_h'] + ":" + data['display_start_time_m'] + " " + data[
                    'display_start_time_ampm']
                start_time_12_hour = datetime.strptime(start_time_12_hour, "%I:%M %p")

                if item['value'] != start_time_12_hour:
                    response = requests.put("{}/config/property/{}".format(settings.ADMIN_WS_URL, "display_start_time"),

                                            data={"value": start_time_12_hour.strftime("%H:%M")}, headers=headers)
                    validate_api_call(response, [])


        # Let the display know that the config was updated
        response = requests.get("{}/display/config".format(settings.COORDINATOR_WS_URL))

        validate_api_call(response, [])

        create_audit(request, headers, None, "CONFIG", "Edited Monitor Display Settings", "UPDATE", None, None)

        messages.success(request, "Successfully updated display monitor settings!")

        return redirect(reverse('settings'))

    # Otherwise redirect to home page
    else:
        return redirect(reverse('admin_login'))




