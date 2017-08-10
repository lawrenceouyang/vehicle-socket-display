from django.conf.urls import url
import views

urlpatterns = [
    url(r'^(?P<location>[a-zA-Z0-9_.-]*)/$', views.index, name='index'),

    # AJAX URLS - DOES NOT RENDER A VIEW
    url(r'^ajax/load-availability-data/$', views.load_availability_data, name='load_availability_data'),
    url(r'^ajax/time/$', views.server_time, name='server_time')
]
