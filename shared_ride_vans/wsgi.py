"""
WSGI config for shared_ride_vans project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

APP_NAME = os.environ.get('APP_NAME', 'ALL')

if APP_NAME == "ADMIN":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_ride_vans.admin_settings")
elif APP_NAME == "COMPANY":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_ride_vans.company_settings")
elif APP_NAME == "COORDINATOR":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_ride_vans.coordinator_settings")
elif APP_NAME == "DISPLAY":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_ride_vans.display_settings")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_ride_vans.settings")

application = get_wsgi_application()




