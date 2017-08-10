from django.conf.urls import url
from admin_portal.views import login, provider, popup_forms, audit, settings, user

urlpatterns = [

    # Login/Out Pages
    url(r'^$', login.login, name='admin_login'),
    url(r'^logout/$', login.logout, name='admin_logout'),

    # Audit / Settings Pages
    url(r'^activity/$', audit.activity, name='activity'),
    url(r'^audit/$', audit.audit_trail, name='audit_trail'),
    url(r'^audit/admin$', audit.get_admin_activity, name='get_admin_activity'),
    url(r'^audit/coordinator$', audit.get_coordinator_activity, name='get_coordinator_activity'),
    url(r'^audit/provider$', audit.get_all_provider_activity, name='get_all_provider_activity'),
    url(r'^audit/(?P<admin_id>[\w\-]+)/$', audit.admin_audit_trail, name='admin_audit_trail'),
    url(r'^audit/provider/(?P<provider_id>[\w\-]+)/$', audit.provider_audit_trail, name='provider_audit_trail'),
    url(r'^audit/provider/(?P<provider_id>[\w\-]+)/info/$', audit.get_provider_activity, name='get_provider_activity'),
    url(r'^settings/$', settings.configuration, name='settings'),


    # Provider / Super User Urls
    url(r'^provider/$', provider.get_all_providers, name="get_all_providers"),
    url(r'^provider/create/$', provider.create_provider, name="create_provider"),
    url(r'^provider/all/$', provider.view_all_provider, name="view_all_provider"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/$', provider.view_provider, name="view_provider"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/edit/$', provider.edit_provider, name="edit_provider"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/lock/$', provider.lock_provider, name="lock_provider"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/delete/$', provider.delete_provider, name="delete_provider"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/restore/$', provider.restore_provider, name="restore_provider"),

    # Super User Urls
    url(r'^user/validate_email/$', user.validate_user_email, name="validate_user_email"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/user/create/$', user.create_user, name="create_user"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/user/(?P<user_id>[\w\-]+)/$', user.get_user, name="get_user"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/users/$', user.get_all_users, name="get_all_users"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/user/(?P<user_id>[\w\-]+)/edit/$', user.edit_user, name="edit_user"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/user/(?P<user_id>[\w\-]+)/lock/$', user.lock_user, name="lock_user"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/user/(?P<user_id>[\w\-]+)/delete/$', user.delete_user, name="delete_user"),
    url(r'^provider/(?P<provider_id>[\w\-]+)/user/(?P<user_id>[\w\-]+)/resend/$', user.resend_user_activation, name="resend_user"),


    # Static HTML Url Templates
    url(r'popup_forms/superuser/create/$', popup_forms.create_superuser, name="create_superuser_form"),
    url(r'popup_forms/superuser/edit/$', popup_forms.edit_superuser, name="edit_superuser_form"),
    url(r'popup_forms/superuser/lock/$', popup_forms.lock_superuser, name="lock_superuser_form"),
    url(r'popup_forms/superuser/unlock/$', popup_forms.unlock_superuser, name="unlock_superuser_form"),
    url(r'popup_forms/superuser/delete/$', popup_forms.delete_superuser, name="delete_superuser_form"),
    url(r'popup_forms/superuser/resend/$', popup_forms.resend_superuser, name="resend_superuser_form"),
    url(r'popup_forms/provider/lock/$', popup_forms.lock_provider, name="lock_provider_form"),
    url(r'popup_forms/provider/unlock/$', popup_forms.unlock_provider, name="unlock_provider_form"),
    url(r'popup_forms/provider/delete/$', popup_forms.delete_provider, name="delete_provider_form"),
    url(r'popup_forms/provider/restore/$', popup_forms.restore_provider, name="restore_provider_form"),


]

# Error views
handler404 = 'admin_portal.views.error.shared_rides_not_found'
handler500 = 'admin_portal.views.error.shared_rides_server_error'
handler403 = 'admin_portal.views.error.shared_rides_permission_denied'
handler400 = 'admin_portal.views.error.shared_rides_bad_request'
