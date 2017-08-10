from shared_ride_vans import admin_settings


def version_number(request):
    return {'VERSION': admin_settings.VERSION}


def environment(request):
    return {'ENV': admin_settings.BUILD_ENV}

