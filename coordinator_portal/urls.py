from django.conf.urls import url
from coordinator_portal.views import company, audit, app, coordinator

urlpatterns = [
    # Login/Out Pages
    url(r'^$', app.login, name='coordinator_login'),
    url(r'^logout/$', app.logout, name='coordinator_logout'),


    # (GET) - Action: Get all coordinators
    url(r'^coordinators/$', coordinator.get_all_coordinators, name='get_all_coordinators'),

    # (POST) - Action: Create a coordinator
    url(r'^coordinator/create/$', coordinator.create_coordinator, name='create_coordinator'),

    # (GET) - Action: Get a coordinator
    url(r'^coordinator/(?P<coordinator_id>[\w\-]+)/$', coordinator.get_coordinator, name='get_coordinator'),

    # (PUT) - Action: Edits a coordinator
    url(r'^coordinator/(?P<coordinator_id>[\w\-]+)/edit/$', coordinator.edit_coordinator, name='edit_coordinator'),

    # (DELETE) - Action: Deletes a coordinator
    url(r'^coordinator/(?P<coordinator_id>[\w\-]+)/delete/$', coordinator.delete_coordinator, name='delete_coordinator'),

    # (GET) - Action: Gets all the check-ins (vehicles)
    url(r'^company/checkin/$', company.get_all_checkins, name='get_all_checkins'),

    # (GET) - Action: Gets a check-ins detail (vehicles)
    url(r'^company/(?P<company_id>[\w\-]+)/vehicle/(?P<vehicle_number>[\w\-]+)/checkin_detail/$', company.get_checkin_detail, name='get_checkin_detail'),

    # (POST) Action: Checks-in a vehicle by giving the company an available desintation
    url(r'^company/(?P<company_id>[\w\-]+)/checkin/$', company.create_checkin, name='create_checkin'),

    # (PUT) Action: Edit a Check-in
    url(r'^company/(?P<company_id>[\w\-]+)/checkin/edit/$', company.edit_checkin, name='edit_checkin'),

    # (PUT) Action: Delete a Check-in
    url(r'^company/(?P<company_id>[\w\-]+)/checkin/delete/$', company.delete_checkin, name='delete_checkin'),

    # (PUT) Action: Checks-out a vehicle by giving the vehicle to checkout and the destinations where it will go
    url(r'^company/(?P<company_id>[\w\-]+)/checkout/$', company.create_checkout, name='create_checkout'),

    # (GET) Action: Gets a list of all the companies in the SRV System
    url(r'^company/$', company.get_all_companies, name='get_all_companies'),

    # (GET) Action: Get a company by its id
    url(r'^company/(?P<company_id>[\w\-]+)/$', company.get_company, name='get_company'),

    # (GET) Action: - Gets a list of company's serviceable destinations
    url(r'^company/(?P<company_id>[\w\-]+)/destinations/$', company.get_company_destinations, name='get_company_destinations'),

    # (GET) Action: Gets a list of the company's vehicles
    url(r'^company/(?P<company_id>[\w\-]+)/vehicles/$', company.get_all_company_vehicles, name='get_all_company_vehicles'),

    # (GET) Action: Gets a company's vehicle detail by its vehicle id
    url(r'^company/(?P<company_id>[\w\-]+)/vehicle/(?P<vehicle_id>[\w\-]+)/$', company.get_vehicle, name='get_vehicle'),


]

