import React from 'react';
import PropTypes from 'prop-types';
import { NerdGraphQuery, Spinner, TableChart, NrqlQuery } from 'nr1';
import { RadioGroup, Radio } from 'react-radio-group';
import { Icon, Table, Menu } from 'semantic-ui-react'
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
            utilThreshold: 0

        };

        this.queryStorage = this.queryStorage.bind(this)

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


    // create the output table
    renderTable(mountPoints){
        return (
            <Table celled>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>ACCOUNT</Table.HeaderCell>
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
                        //<Spinner type={Spinner.TYPE.INLINE} size="20px"/>
                        <Icon loading name='sync' size='large' color='green'/>
                        :
                        ""
                    }
                    {this.state.accountsFinished + "/" + this.state.accounts.length}

                </div>

                <div>
                    <Menu style={{marginBottom:"0px", marginTop:"5px", textAlign:"center"}}>
                        <Menu.Item>Utilization Threshold:</Menu.Item>
                        <Menu.Item><input type='range' max='100' step='1' value={this.state.utilThreshold} onChange={(e)=>this.setState({utilThreshold: e.target.value})} style={{width:"100%"}}/></Menu.Item>
                        <Menu.Item>{this.state.utilThreshold}</Menu.Item>
                    </Menu>
                </div>

                {this.renderTable(this.state.allStorageSamples)}

            </div>

        )
    }
}
