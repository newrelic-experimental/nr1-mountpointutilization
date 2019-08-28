import React from 'react';
import PropTypes from 'prop-types';
import { NerdGraphQuery } from 'nr1';
import { RadioGroup, Radio } from 'react-radio-group';
import { Icon, Table, Menu, Button } from 'semantic-ui-react'
import gql from 'graphql-tag';

export default class MyNerdlet extends React.Component {
    static propTypes = {
        nerdletUrlState: PropTypes.object,
        launcherUrlState: PropTypes.object,
        width: PropTypes.number,
        height: PropTypes.number,
    };

    constructor(props) {

        super(props);
        this.state = {

            serverName: null,
            mountPoint: null,
            whereClause: "",
            allStorageSamples: [],
            accounts: [],
            accountsFinished: 0,
            utilThreshold: 0,
            searched: [],
            accountNameInput: "",
            serverNameInput: "",
            mountPointNameInput: "",

        };

        this.queryStorage = this.queryStorage.bind(this)
        this.renderTable = this.renderTable.bind(this)
        this.searchTable = this.searchTable.bind(this)
        this.handleUtilThreshold = this.handleUtilThreshold.bind(this)

    }

    // build a custom logging method
    nerdLog(msg){

        if(this.state.enableNerdLog){

            /*eslint no-console: ["error", { allow: ["warn", "error"] }] */
            console.warn(msg);

        }
    }

    // use the componentDidMount method to set state before render
    async componentDidMount(){

        // built the graphQL query to iterate all accounts
        const accountsQuery = gql`{actor { accounts { id name } } }`

        // query accounts and set hte 'accounts' variable
        this.nerdLog("fetching newrelic accounts")
        let results = await NerdGraphQuery.query({query: accountsQuery})
        // validate NRQL results and handle NULLs
        // http://web.archive.org/web/20161108071447/http://blog.osteele.com/posts/2007/12/cheap-monads/
        let accounts = (((results || {}).data || {}).actor || {}).accounts || []
        this.setState({accounts: accounts})

    }

    //handle used with slider for utilization threshold
    handleThreshold(e){

        this.setState({ utilThreshold: e.target.value })

    }

    // method to update the where clause based on the selection on the radio group
    async queryStorage(d){

        // start by clearing out any orphaned value
        let whereClause = ""

        // set the whereClause value based on the selected radio button
        switch(d){

            case "db2":
                whereClause = "WHERE (mountPoint = '/data' OR mountPoint LIKE '%/db2%')"
                break;

            case "sql":
                whereClause = "WHERE mountPoint IN ('F:','L:','T:','Z:')"
                break;

            case "oracle":
                whereClause = "WHERE mountPoint IN ('/u01', '/u02', '/u03', '/u04', '/u05', '/u06', '/u07')"
                break;

        }

        // build the base-query to be used for all the table
        let tableNrql = `SELECT max(diskUsedPercent) AS 'utilization' FROM StorageSample ${whereClause} FACET hostname, mountPoint, entityGuid  LIMIT MAX`;

        // query the storage data for all accounts
        const getInstanceData = (accountId) => {
            return gql`{
                actor {
                account(id: ${accountId}) {
                    storage: nrql(query: "${tableNrql}", timeout: 30000) {
                    results
                    }
                }
                }
            }`
            }

        await this.setState({allStorageSamples: [], accountsFinished: 0});

        this.state.accounts.forEach(async (account, i) => {

            let results = await NerdGraphQuery.query({query: getInstanceData(account.id)})
            if(results.errors){

                this.nerdLog(results.errors)

            }else{

                let tempStorage = this.state.allStorageSamples
                // validate NRQL results and handle NULLs
                // http://web.archive.org/web/20161108071447/http://blog.osteele.com/posts/2007/12/cheap-monads/
                let storageSamples = (((((results || {}).data || {}).actor || {}).account || {}).storage || {}).results || []
                storageSamples.forEach((sample)=>{
                    console.log(sample)
                    sample.accountId = account.id
                    sample.accountName = account.name
                    tempStorage.push(sample)
                })

                // create a progress counter
                let accountsFin = this.state.accountsFinished
                accountsFin = accountsFin+1
                this.setState({allStorageSamples: tempStorage, accountsFinished: accountsFin})

            }
        } )

    }

    handleUtilThreshold(utilThreshold) {
        this.setState({utilThreshold});
    }

    async searchTable(e){
        console.log(e.target.id, e.target.value)

        if(e.target.value != ""){
            await this.setState({[e.target.id]:e.target.value})
        }else{
            await this.setState({[e.target.id]:""})
        }

        // || this.state.utilThreshold > 0
        if(this.state.accountNameInput != "" || this.state.serverNameInput != "" || this.state.mountPointNameInput != ""){
            let searched = this.state.allStorageSamples

            searched = searched.filter( (aName) => aName.accountName.toLowerCase().includes(this.state.accountNameInput) )
            searched = searched.filter( (aName) => aName.facet[0].toLowerCase().includes(this.state.serverNameInput) )
            searched = searched.filter( (aName) => aName.facet[1].toLowerCase().includes(this.state.mountPointNameInput) )
            //searched = searched.filter( handleUtilThreshold(this.state.utilThreshold) )
            this.setState({searched:searched})
            console.log("setting search: ",searched)

        }

        if(this.state.accountNameInput == "" && this.state.serverNameInput == "" && this.state.mountPointNameInput == "" ){
            console.log("resetting all search fields")
            this.setState({"searched":this.state.allStorageSamples})
        }
    }

    // create the output table
    renderTable(mountPoints){


        return (
            <Table celled id="myTable">

                <Table.Header>

                <tr>
                    <td>

                        <input type="text" id="accountNameInput" onChange={this.searchTable} value={this.state.accountNameInput} placeholder="Search Sub-Account Name..." title="Sub-Account Name"></input>
                        <input type="text" id="serverNameInput" onChange={this.searchTable}  value={this.state.serverNameInput} placeholder="Search Server Name..." title="Server Name"></input>
                        <input type="text" id="mountPointNameInput" onChange={this.searchTable}  value={this.state.mountPointNameInput} placeholder="Search Mount Point Name..." title="Mount Point Name"></input>
                        { /* <input type="text" id="utilPercentInput" onChange={this.searchTable} placeholder="Search Utilization Percent..." title="Utilization Percent"></input> */}
                        { /* <input type="range"  id="utilPercentInput" max="100" step="1" value={this.state.utilThreshold} onChange={(e)=>this.setState({utilThreshold: e.target.value})} ></input> */}

                        { /* <Menu id="utilPercentInput">
                            <Menu.Item>Utilization Threshold:</Menu.Item>
                            <Menu.Item><input type='range' max='100' step='1' onChange={this.handleUtilThreshold} value={this.state.utilThreshold}></input></Menu.Item>
                            <Menu.Item>{this.state.utilThreshold}</Menu.Item>
                        </Menu> */ }

                        <Button onClick={()=>this.setState({"searched":[],"accountNameInput":"",serverNameInput:"",mountPointNameInput:""})}>Reset Search</Button>

                    </td>
                </tr>

                    <Table.Row>
                        <Table.HeaderCell>SUB-ACCOUNT</Table.HeaderCell>
                        <Table.HeaderCell>SERVER</Table.HeaderCell>
                        <Table.HeaderCell>MOUNT POINT</Table.HeaderCell>
                        <Table.HeaderCell>UTILIZATION %</Table.HeaderCell>
                    </Table.Row>

                </Table.Header>

                <Table.Body>


                    {
                        mountPoints.map((mp, i)=>{

                            let accountUrl = `https://infrastructure.newrelic.com/accounts/${mp.accountId}`
                            let serverUrl = `https://one.newrelic.com/redirect/entity/${mp.facet[2]}`

                            return (
                            <Table.Row key={i}>
                                <Table.Cell><a href={accountUrl} target="_blank">{mp.accountName}</a></Table.Cell>
                                <Table.Cell><a href={serverUrl} target="_blank">{mp.facet[0]}</a></Table.Cell>
                                <Table.Cell>{mp.facet[1]}</Table.Cell>
                                <Table.Cell>{mp.utilization.toFixed(2)}</Table.Cell>
                            </Table.Row>
                            )
                        })
                    }
                </Table.Body>
            </Table>
        )
    }

    render() {

        let mountPoints = this.state.searched.length > 0 ? this.state.searched : this.state.allStorageSamples

        // output the individual payloads to console
        //console.log(this.state.allStorageSamples)

        return (

            <div>
                {/* build a radio group from react-radio-group with buttons mapped to the DBA teams */}
                <RadioGroup
                    className='radio-group'
                    name="dba-team"
                    onChange={this.queryStorage}>

                    <div className='radio-option'>
                        <Radio value="db2" />DB2 TEAM
                        <Radio value="sql" />MSSQL TEAM
                        <Radio value="oracle" />ORACLE TEAM
                    </div>
                </RadioGroup>

                <div className='progress'>
                    { this.state.accountsFinished != this.state.accounts.length && this.state.accountsFinished != 0 ?
                        <Icon loading name='sync' size='large' color='green'/>
                        :
                        ""
                    }
                    {this.state.accountsFinished + "/" + this.state.accounts.length}

                </div>

                {this.renderTable(mountPoints)}

            </div>

        )
    }
}
