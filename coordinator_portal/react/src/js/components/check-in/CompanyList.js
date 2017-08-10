//React
import React from "react"
import { connect } from "react-redux"
//Material UI
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';
import Subheader from 'material-ui/Subheader';
import {List, ListItem} from 'material-ui/List';
import CircularProgress from 'material-ui/CircularProgress';
import ErrorMessage from "../../components/error"
import LockOutline from 'material-ui/svg-icons/action/lock-outline';
// axios
import axios from "axios";


export default class CompanyList extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            loaded: false,
            companyList : [],
            errorCode: ""
         };
    }

    componentDidMount(){
        this.getCompanyList();
    }

    // Fired when the radio button is changed
    handleChange = (event,value) => {

        this.props.setCompany(value);
    };


    getCompanyList = () => {

        var {loaded, companyList, errorCode} = this.state;
        // Run the ajax call
        axios.get('/coordinator/company/')
          .then(res =>  {
            companyList=res.data.companies;
            loaded=true;
            this.setState({companyList,loaded});
          })
          .catch(res => {
                errorCode = res.status + "";
                this.setState({errorCode});
          });
    };

    eachCompany = (company, index) => {
        var styles={
             radioButton: {
                marginBottom: 16,
                 zIndex: 999,
            }
        };
        // Return every radio button for enabled company only
        if (company["enabled"]){
            return(
            <RadioButton value={company["company_id"]} label={company["display_name"]} key={index}
                         style={styles.radioButton}/>
            )
        }
        else{
            return(
            <RadioButton value={company["company_id"]} label={company["display_name"]} key={index}
                         style={styles.radioButton} disabled={true} uncheckedIcon={<LockOutline />}/>
            )
        }
    };
    render(){
        const styles = {
            subHeaderStyle:{
                paddingLeft:0,
                lineHeight:"68px",
                marginTop:-20
            }
        };
        var {loaded,companyList, errorCode} = this.state;
        return(
            <div>
                {loaded &&
                <div>
                    <Subheader style={styles.subHeaderStyle}>Please Select a Company</Subheader>
                    <div style={{maxHeight:250, overflowY:"scroll"}}>
                    <RadioButtonGroup name="companyList" valueSelected={this.props.selectedCompanyId} onChange={this.handleChange}>
                        {companyList.map(this.eachCompany)}
                    </RadioButtonGroup>
                    </div>
                </div>
                }
                {!loaded && errorCode=="" &&
                    <div class="loader"><CircularProgress/></div>
                }
                {errorCode!="" &&  <ErrorMessage errorCode={errorCode}/>}
            </div>
        )
    }
}