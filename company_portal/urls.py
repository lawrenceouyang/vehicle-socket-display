from django.conf.urls import url
from company_portal.views import company, account

urlpatterns = [
    # Login/Out Pages, Reset Password
    url(r'^$', account.login, name='company_login'),
    url(r'^logout/$', account.logout, name='company_logout'),
    url(r'^activate/$', account.activate, name='company_activate_account'),
    url(r'^reset_password/$', account.reset_password, name='company_reset_password'),
    url(r'^forgot_password/$', account.forgot_password, name='company_forgot_password'),

    # (GET) - Action: Get the company's information by it's id
    url(r'^info/$', company.get_company_info, name='get_company_info'),

    # (GET) - Action: Get the company's available destinations by its id
    url(r'^available_destinations/$', company.get_company_available_destinations, name='get_company_available_destinations'),

    # (GET) - Action: Get the company's check-in information by its id
    url(r'^checkin_info/$', company.get_company_curbside_checkins, name='get_company_curbside_checkins'),

    # (GET) - Action: Get the company's contact info by its id
    url(r'^contact_info/$', company.get_company_contact_info, name='get_company_contact_info'),

    # (GET) - Action: Get the company's entire editable information (check-in info and contact info) by its id
    url(r'^editable_info/$', company.get_all_company_editable_info, name='get_all_company_editable_info'),

    # (PUT) - Action: Edit's the company's contact info
    url(r'^editable_info/edit/$', company.edit_contact_info, name='edit_company_contact_info'),

]

