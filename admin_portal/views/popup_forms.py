from django.shortcuts import render

# Super User Forms
def create_superuser(request):
    return render(request, "admin_portal/popup_forms/create_superuser.html")


def edit_superuser(request):
    return render(request, "admin_portal/popup_forms/edit_superuser.html")


def lock_superuser(request):
    return render(request, "admin_portal/popup_forms/lock_superuser.html")


def unlock_superuser(request):
    return render(request, "admin_portal/popup_forms/unlock_superuser.html")


def delete_superuser(request):
    return render(request, "admin_portal/popup_forms/delete_superuser.html")


def resend_superuser(request):
    return render(request, "admin_portal/popup_forms/resend_superuser.html")


# Provider Forms
def lock_provider(request):
    return render(request, "admin_portal/popup_forms/lock_provider.html")


def unlock_provider(request):
    return render(request, "admin_portal/popup_forms/unlock_provider.html")


def delete_provider(request):
    return render(request, "admin_portal/popup_forms/delete_provider.html")


def restore_provider(request):
    return render(request, "admin_portal/popup_forms/restore_provider.html")


