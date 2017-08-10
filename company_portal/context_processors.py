from shared_ride_vans import company_settings


def version_number(request):
    return {'VERSION': company_settings.VERSION}


def environment(request):
    return {'ENV': company_settings.BUILD_ENV}

