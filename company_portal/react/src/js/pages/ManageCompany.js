//React
import React from "react"
import { Link } from "react-router";
// Flex box grid
import { Grid, Row, Col } from 'react-flexbox-grid/lib/index'
// Material UI
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import Snackbar from 'material-ui/Snackbar';
import FontIcon from 'material-ui/FontIcon';
import {List, ListItem} from 'material-ui/List';
import RaisedButton from 'material-ui/RaisedButton'
import CircularProgress from 'material-ui/CircularProgress';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import Toggle from 'material-ui/Toggle';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
// Axios
import axios from "axios";
// Components
import ErrorMessage from "../components/error"

export default class CompanySummary extends React.Component {

    constructor(props){
        super(props);
        var snackBarMessage = (this.props.location.state==null ? "": this.props.location.state);
        this.state = {
            dataLoaded : false,
            errorCode: "",
            informationData:{},
            showSnackBar:false,
            snackBarMessage: "",
            snackBarAction: "",
            showErrorPopup: false
        };
    }

    componentDidMount(){
        this.getInformationData();
    }

    // Grab the Destinations for the company
    getInformationData = () => {
        var {informationData, dataLoaded, errorCode} = this.state;
        // Run the ajax call
        axios.get('/company/editable_info/')
            .then(res => {
                informationData = res.data;
                var company_contact = informationData.company_contact;
                for (var contact in company_contact){
                    if(company_contact[contact].contact_type=="phone_number" && company_contact[contact].enabled){
                        company_contact[contact]["original"]=true;
                    }
                }
                dataLoaded = true;
                this.setState({informationData, dataLoaded});
            })
            .catch(res=>{
                errorCode = res.status + "";
                if (res.status==401 && this.props.setLocked ) {
                    this.props.setLocked(res.data.reason);
                }
                else{
                    this.setState({errorCode});
                }
            });
    };

    // submit Information Data

    
    submitInformationData = () => {
        var {informationData, dataLoaded, errorCode, snackBarMessage, showSnackBar, snackBarAction} = this.state;
        console.log("Current Information Data", this.state.informationData);
        // If at least one field is not true don;t allow the submission to happen
        //delete unchanged values
        var atLeastOneSelected = false;
        for (var i=informationData.company_contact.length-1; i>=0; i--){
            if(informationData.company_contact[i]["enabled"])
            {
               atLeastOneSelected=true;
               break;
            }
        }
        for (var i=informationData.curbside_checkin.length-1; i>=0; i-- ){
            if( informationData.curbside_checkin[i]["enabled"] ) // changed is false
            {
               atLeastOneSelected=true;
               break;
            }
        }

        if(!atLeastOneSelected){
            this.setState({showErrorPopup: true});
            return;
        }
        this.setState({dataLoaded:false});
        // for (var contacts in )
        for (var i=informationData.company_contact.length-1; i>=0; i--){
            if(!("changed"  in informationData.company_contact[i])  // changed is not in the object
                || !informationData.company_contact[i]["changed"] ) // changed is false
            {
                console.log("loop pass",informationData.company_contact[i]);
               informationData.company_contact.splice(i,1);
            }
            else{
                console.log("loop fail",informationData.company_contact[i]);
            }
        }
        for (var i=informationData.curbside_checkin.length-1; i>=0; i-- ){
            if(!("changed"  in informationData.curbside_checkin[i])  // changed is not in the object
                || !informationData.curbside_checkin[i]["changed"] ) // changed is false
            {
               informationData.curbside_checkin.splice(i,1);
            }
        }
        console.log("submit", informationData);
        // Run the ajax call
        axios.post('/company/editable_info/edit/', {information_data: informationData})
            .then(res => {
                snackBarMessage = "Information successfully updated";
                showSnackBar = true;
                snackBarAction = "Success!";
                this.setState({snackBarMessage, showSnackBar, snackBarAction});
                this.getInformationData();
            })
            .catch(res=>{
                errorCode = res.status + "";
                showSnackBar = true;
                snackBarMessage = "Information could not updated";
                snackBarAction = "Error!";
                this.setState({snackBarMessage, showSnackBar, snackBarAction, errorCode});
            });
    };

    closeSnackBar = () =>{
        this.setState({showSnackBar:false});
    };
    /************************************************************************************************
                                    Phone Getter/Setter/Handler
     ************************************************************************************************/

    eachPhone = (contact, index) =>{
        if(contact.contact_type=="phone_number"){
               return(
                    <MenuItem value={contact} key={index} primaryText={contact.contact_info} disabled={contact==this.getSelectedPhone()}/>
                )
            }
    };

    getTelephoneList = () => {
        return (<ListItem key={1}
                          hoverColor="#fff">
                <SelectField floatingLabelText="Telephone Number"
                             value={this.getSelectedPhone()}
                             onChange={this.handlePhoneChange}
                >{this.state.informationData.company_contact.map(this.eachPhone)}
                </SelectField>
        </ListItem>
        )

    };

    handlePhoneChange = (event, index, value) => {
        var {company_contact} = this.state.informationData;
        var {informationData}=this.state;
        for (var contact in company_contact){
            if(company_contact[contact]["original"] && company_contact[contact]["company_contact_id"]!=value["company_contact_id"]){
                company_contact[contact]["enabled"]=false;
                company_contact[contact]["changed"]=true;
            }
            else if(company_contact[contact]["original"] && company_contact[contact]["company_contact_id"]==value["company_contact_id"]){
                company_contact[contact]["enabled"]=true;
                company_contact[contact]["changed"]=false;
            }
            else if(company_contact[contact]["company_contact_id"]==value["company_contact_id"]){
                company_contact[contact]["enabled"]=true;
                company_contact[contact]["changed"]=true;
            }
            else if (company_contact[contact]["contact_type"]== "phone_number"){
                company_contact[contact]["enabled"]=false;
                company_contact[contact]["changed"]=false;
            }
        }
        this.setState({company_contact, informationData});
    };

    getSelectedPhone = () => {
        var {company_contact} = this.state.informationData;
        for (var contact in company_contact){
            if(company_contact[contact].contact_type=="phone_number" && company_contact[contact].enabled){
                return (company_contact[contact]);
            }
        }
    };

    phoneIsActive = () => {
        var {company_contact} = this.state.informationData;
        for (var contact in company_contact){
            if(company_contact[contact].contact_type=="phone_number" && company_contact[contact].enabled){
                return (true);
            }
        }
        return false;
    };


    togglePhone = (event, isActive) => {
        var {company_contact} = this.state.informationData;
        // Deactivate All Phones
        if(!isActive){
            for (var contact in company_contact){
                if(company_contact[contact].contact_type=="phone_number" && company_contact[contact].enabled){
                    company_contact[contact]["changed"]=true;
                }
                if(company_contact[contact].contact_type=="phone_number"){
                    company_contact[contact]["enabled"]=false;
                }
            }
        }
        else{
            for (var contact in company_contact){
                 if(company_contact[contact].contact_type=="phone_number"){
                     company_contact[contact]["enabled"]=false;
                 }
            }

            var found = false;

            for (var contact in company_contact){
                if(company_contact[contact].contact_type=="phone_number" && company_contact[contact]["original"]){
                    company_contact[contact]["enabled"]=true;
                    company_contact[contact]["changed"]=false;
                    found=true;
                    break;
                }
            }

            if (!found){
                for (var contact in company_contact){
                if(company_contact[contact].contact_type=="phone_number"){
                    company_contact[contact]["enabled"]=true;
                    company_contact[contact]["changed"]=true;
                    found=true;
                    break;
                }
            }

            }
        }
        this.setState({company_contact});
    };


    /************************************************************************************************
                                    Website Getter/Setter
     ************************************************************************************************/
    getCompanyWebsite = () => {
        var contacts = this.state.informationData.company_contact;
        for (var contact in contacts){
                    if(contacts[contact].contact_type=="website"){
                        return (contacts[contact].contact_info);
                    }
                }
    };

    websiteIsActive = () => {
        var {company_contact} = this.state.informationData;
        for (var contact in company_contact){
            if(company_contact[contact].contact_type=="website" && company_contact[contact].enabled){
                return (true);
            }
        }
        return false;
    };

    toggleWebsite = (event, isActive) => {
        var {company_contact} = this.state.informationData;
        // Toggle Website
        for (var contact in company_contact){
                if(company_contact[contact].contact_type=="website"){
                    company_contact[contact]["enabled"]=isActive;
                    company_contact[contact]["changed"]=!company_contact[contact]["changed"];
                }
            }
        this.setState({company_contact});
    };


    /************************************************************************************************
                                    Curbside Checkin Getter/Setter
    ************************************************************************************************/

    curbSideCheckinIsActive = (curbside_checkin_id) =>{
        var {curbside_checkin} = this.state.informationData;
        for (var checkin in curbside_checkin){
            if(curbside_checkin[checkin]["curbside_checkin_id"]==curbside_checkin_id
                && curbside_checkin[checkin].enabled){
                return (true);
            }
        }
        return false;
    };

    toggleCurbSideCheckin = (event, isActive, curbside_checkin_id) => {
        var {curbside_checkin} = this.state.informationData;
        for (var checkin in curbside_checkin){
            if(curbside_checkin[checkin]["curbside_checkin_id"]==curbside_checkin_id){
                curbside_checkin[checkin]["enabled"]= isActive;
                curbside_checkin[checkin]["changed"]= !curbside_checkin[checkin]["changed"];
            }
        }
        this.setState({curbside_checkin});

    };

    eachCurbSideCheckin = (value, index) => {
        return(
        <ListItem key={index} primaryText="Curbside Staff" secondaryText={value["terminal"]}
                  rightToggle={<Toggle toggled={this.curbSideCheckinIsActive(value["curbside_checkin_id"])}
                  onToggle={(event, isActive)=>this.toggleCurbSideCheckin(event, isActive, value["curbside_checkin_id"])}/>}/>
        );
    };



    render() {
        //console.log("Current Information Data", this.state.informationData);
        var {dataLoaded, errorCode, informationData} = this.state;
        return(
            <div style={{position:"relative",height:'calc(100vh - 120px)', overflowY:'scroll'}}>
                {!dataLoaded && errorCode=="" && <div class="loader" style={{bottom:"200px", top:"200px"}}><CircularProgress/></div>}
                {dataLoaded &&
                    <div>
                        <List style={{marginTop:"2px"}}>
                            <ListItem primaryText="Telephone"
                                      rightToggle={<Toggle toggled={this.phoneIsActive()}
                                                           onToggle={this.togglePhone}/>}
                                      open={this.phoneIsActive()}
                                      style={{fontWeight:"bold"}}
                                      primaryTogglesNestedList={false}
                                      nestedItems={[this.getTelephoneList()]}
                                      hoverColor="rgba(255,255,255,0)"
                                      nestedListStyle={{marginTop:"-25px", marginLeft:"-18px"}}/>
                            <ListItem primaryText="Website"
                                      secondaryText={this.getCompanyWebsite()}
                                      rightToggle={<Toggle toggled={this.websiteIsActive()} onToggle={this.toggleWebsite}/>}/>
                            {informationData["curbside_checkin"].map(this.eachCurbSideCheckin)}
                        </List>
                        <br/>
                        <Row>
                        <Col xs={6} sm={6} md={6} lg={6} xsOffset={3} smOffset={3} mdOffset={3} lgOffset={3} >
                                <RaisedButton label="Save"
                                              fullWidth={true} backgroundColor="#0288D1"
                                              labelColor="#fff"
                                              onClick={this.submitInformationData}/>
                        </Col>
                        </Row>
                    </div>
                }
                {errorCode!="" && <ErrorMessage errorCode={errorCode}/>}
                <Snackbar
                    open={this.state.showSnackBar}
                    message={this.state.snackBarMessage}
                    action={this.state.snackBarAction}
                    autoHideDuration={5000}
                    onRequestClose={this.closeSnackBar}
                />
                <Dialog
                  title="At least one option must be selected!"
                  actions={<FlatButton
                            label="Ok"
                            primary={true}
                            onTouchTap={()=> this.setState({showErrorPopup:false})}
                            />}
                  modal={false}
                  open={this.state.showErrorPopup}
                  onRequestClose={()=> this.setState({showErrorPopup:false})}
                  contentStyle={{width:"300px"}}>
                </Dialog>
            </div>
        )
    }
};