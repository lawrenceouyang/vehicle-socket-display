"""shared_ride_vans URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""

import os
from django.conf.urls import url, include

APP_NAME = os.environ.get('APP_NAME', 'ALL')

urlpatterns = []

# Only list the app urls/error pages specified by the Jenkins Environment Variable (unless dev/local)
# Default: (DEBUG) Load all app urls on the same port with admin error pages
if APP_NAME == "ADMIN":
    urlpatterns.append(url(r'^admin/', include('admin_portal.urls')))
    handler404 = 'admin_portal.views.error.shared_rides_not_found'
    handler500 = 'admin_portal.views.error.shared_rides_server_error'
    handler403 = 'admin_portal.views.error.shared_rides_permission_denied'
    handler400 = 'admin_portal.views.error.shared_rides_bad_request'
elif APP_NAME == "COMPANY":
    urlpatterns.append(url(r'^company/', include('company_portal.urls')))
    handler404 = 'company_portal.views.error.shared_rides_not_found'
    handler500 = 'company_portal.views.error.shared_rides_server_error'
    handler403 = 'company_portal.views.error.shared_rides_permission_denied'
    handler400 = 'company_portal.views.error.shared_rides_bad_request'
elif APP_NAME == "COORDINATOR":
    urlpatterns.append(url(r'^coordinator/', include('coordinator_portal.urls')))
    handler404 = 'coordinator_portal.views.error.shared_rides_not_found'
    handler500 = 'coordinator_portal.views.error.shared_rides_server_error'
    handler403 = 'coordinator_portal.views.error.shared_rides_permission_denied'
    handler400 = 'coordinator_portal.views.error.shared_rides_bad_request'
elif APP_NAME == "DISPLAY":
    urlpatterns.append(url(r'^display/', include('display.urls')))
    handler404 = 'display.views.shared_rides_not_found'
    handler500 = 'display.views.shared_rides_server_error'
    handler403 = 'display.views.shared_rides_permission_denied'
    handler400 = 'display.views.shared_rides_bad_request'
else:
    urlpatterns.append(url(r'^admin/', include('admin_portal.urls')))
    urlpatterns.append(url(r'^company/', include('company_portal.urls')))
    urlpatterns.append(url(r'^coordinator/', include('coordinator_portal.urls')))
    urlpatterns.append(url(r'^display/', include('display.urls')))
    handler404 = 'display.views.shared_rides_not_found'
    handler500 = 'display.views.shared_rides_server_error'
    handler403 = 'display.views.shared_rides_permission_denied'
    handler400 = 'display.views.shared_rides_bad_request'