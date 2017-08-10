//React
import React from "react"
import { connect } from "react-redux"
//Material UI
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';
import Subheader from 'material-ui/Subheader';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
// Flex box grid
import { Grid, Row, Col } from 'react-flexbox-grid/lib/index'
import CircularProgress from 'material-ui/CircularProgress';
// axios
import axios from "axios";
// components
import ErrorMessage from "../../components/error"



export default class Summary extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            loaded: false,
            company: {},
            errorCode: ""
         };
    }

    eachDestination = (value, index) => {
         return (index==0 ? value.destination.destination_name : " | " + value.destination.destination_name)
    };

    componentDidMount(){
         this.getCompany();
     }

    getCompany = () => {

        var {loaded, company, errorCode} = this.state;
        // Run the ajax call
        axios.get('/coordinator/company/' + this.props.selectedCompanyId +'/')
          .then(res =>  {
            company=res.data;
            loaded=true;
            this.setState({company,loaded});
          })
          .catch(res => {
                errorCode = res.status + "";
                this.setState({errorCode});
          });
    };

    render(){
        var {selectedVehicle, selectedDestinations} = this.props;
        var {loaded,company, errorCode} = this.state;
        const styles = {
            subHeaderStyle:{
                paddingLeft:0,
                lineHeight:"68px",
                marginTop:-20}
        };
        return (
            <div>
                {loaded &&
                <Col xs={6} sm={6} md={6} lg={6}>
                    <Subheader style={styles.subHeaderStyle}>Confirm Check-in</Subheader>
                    <List>
                        <ListItem
                            primaryText={<p>Company:<span style={{float:"right"}}> {company.company_name} </span></p>}
                            secondaryTextLines={1}
                        />
                        <Divider />
                        <ListItem
                            primaryText={<p>Vehicle Number:<span style={{float:"right"}}> {selectedVehicle.vehicle_number} </span></p>}
                            secondaryTextLines={1}
                        />
                        <Divider/>
                        <ListItem
                            primaryText={
                                <p>Destinations:
                                    <span style={{float:"right"}}>
                                        {selectedDestinations.length==0 ?
                                        "Administrative Reason" : selectedDestinations.map(this.eachDestination)}
                                    </span>
                                </p>}
                            secondaryTextLines={1}
                        />
                    </List>
                </Col>
                }
                {!loaded && errorCode=="" &&
                        <div class="loader"><CircularProgress/></div>
                }
                {errorCode!="" &&  <ErrorMessage errorCode={errorCode}/>}
             </div>
        )
    }
}