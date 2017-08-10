//React
import React from "react"
import { connect } from "react-redux"
import { Link } from "react-router";
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
// Flex box grid
import { Grid, Row, Col } from 'react-flexbox-grid/lib/index'
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
import RaisedButton from 'material-ui/RaisedButton';
// axios
import axios from "axios";


export default class AddUser extends React.Component {

     /*************************************************************************************
     * Constructor to set the initial state of the checkin summary component
     * @param props
     *************************************************************************************/
    constructor(props){
        super(props);
        this.state = {
            userData:  {first_name: "", last_name: "", email: "", admin: false},
            errorText: {first_name: "", last_name: "", email: ""},
            dataIsValid: {first_name: false, last_name: false, email: false}
        };
    }

    // Returns true if an email address is valid
    isValidEmail(emailAddress) {
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
    };

    // Returns true if all the input fields are complete and valid
    allIsValid = () => {
        var {dataIsValid}=this.state;
        return dataIsValid.first_name && dataIsValid.last_name && dataIsValid.email;
    };


    /*************************************************************************************
     * Handlers to change the state of the input variables upon user interaction
     *************************************************************************************/

    handleFirstNameChange = (object, newString) =>{
        var {errorText,userData,dataIsValid} = this.state;
        if (newString==""){
            this.state.errorText.first_name="Please Enter a Valid First Name";
            this.state.dataIsValid.first_name = false;
        }
        else{
            this.state.errorText.first_name="";
            this.state.dataIsValid.first_name=true;
        }
        this.state.userData["first_name"]=newString;
        this.setState({errorText,userData, dataIsValid});
    };

    handleLastNameChange = (object, newString) =>{
        var {errorText,userData, dataIsValid} = this.state;
        if (newString==""){
            this.state.errorText.last_name="Please Enter a Valid Last Name";
            this.state.dataIsValid.last_name=false;
        }
        else{
            this.state.errorText.last_name="";
            this.state.dataIsValid.last_name=true;
        }
        this.state.userData["last_name"]=newString;
        this.setState({errorText,userData, dataIsValid});
    };

    handleEmailChange = (object, newString) =>{
        var {errorText,userData, dataIsValid} = this.state;
        if (!this.isValidEmail(newString)){
            this.state.dataIsValid.email=false;
            this.state.errorText.email="Please Enter a Email Address";
        }
        else{
            this.state.errorText.email="";
            this.state.dataIsValid.email=true;
        }
        this.state.userData["email"]=newString;
        this.setState({errorText,userData, dataIsValid});
    };

    handleAdminChange = (object, checked) =>{
        this.state.userData["admin"]=checked;
    };

    /*************************************************************************************
     * Adds new user by calling the create post in the server
     *************************************************************************************/

    addNewUser = () => {
        var {userData} = this.state;
        // Run the ajax call
        axios.post('/coordinator/coordinator/create/', userData)
            .then(res => {
                var message = "User " + userData["email"] + " Successfully Created";
                this.context.router.replace({pathname:'/users',state: message});
            })
            .catch(res=>{
                this.setState({errorCode: res.status + ""});
                var message = "User " + userData["email"] + " Could Not Be Created";
                if(res.status==409){
                    message = "User " + userData["email"] + " Already Exists!";
                }
                this.context.router.replace({pathname:'/users',state: message});
            });
    };

     /*********************************************************************************************************
      * The best part of all, render function
      * Form with 4 components, firstname, lastname, email and isAdmin checkbox. Also the Add user Button!
     **********************************************************************************************************/
    render() {
        var {errorText} = this.state;
        return(
             <Card  style={{marginTop:-1, boxShadow: "none",  height: 'calc(100vh - 62px)'}}>
                 <Row>
                    <Col xs={12} sm={6} md={6} lg={6} smOffset={3} mdOffset={3} lgOffset={3}>
                        <br/>
                        <Row>
                            <Col xs={6} sm={6} md={6} lg={6}>
                                <TextField hintText="First Name *" errorText={errorText.first_name} fullWidth={true} onChange={this.handleFirstNameChange}/>
                            </Col>
                         <Col xs={6} sm={6} md={6} lg={6}>
                                <TextField hintText="Last Name *"  errorText={errorText.last_name} fullWidth={true} onChange={this.handleLastNameChange}/>
                         </Col>
                        </Row>
                        <br/>
                        <TextField hintText="Email *" errorText={errorText.email} fullWidth={true} onChange={this.handleEmailChange}/>
                        <br/><br/>
                        <Checkbox label="Create as Administrator?" onCheck={this.handleAdminChange}/>
                        <br/>
                        <RaisedButton label="Add user" primary={true} onClick={this.addNewUser} disabled={!this.allIsValid()}/>
                    </Col>
                </Row>
            </Card>
        )
    }

}

// Required for routing to a different page from the current page
AddUser.contextTypes={
    router: React.PropTypes.object.isRequired
};