// intro to ES6 imports: https://appdividend.com/2019/01/23/javascript-import-statement-tutorial-with-example/
import React from 'react';
import PropTypes from 'prop-types';
import { NerdGraphQuery, navigation, Stack, StackItem } from 'nr1';
import { RadioGroup, Radio } from 'react-radio-group';
import { Icon, Table, Button } from 'semantic-ui-react'
import gql from 'graphql-tag';

export default class MyNerdlet extends React.Component {
    static propTypes = {
        nerdletUrlState: PropTypes.object,
        launcherUrlState: PropTypes.object,
        width: PropTypes.number,
        height: PropTypes.number,
    };

    // build your constructor to initialize state and bind methods
    // ref: https://reactjs.org/docs/react-component.html#constructor
    constructor( props ) {

        super( props );

        // set the initial states
        this.state = {

            serverName: null,
            mountPoint: null,
            whereClause: "",
            allStorageSamples: [],
            accounts: [],
            accountsFinished: 0,
            utilThreshold: 0, // the default starting utilization threshold for the table
            searched: [],
            accountNameInput: "",
            serverNameInput: "",
            mountPointNameInput: "",
            searchStatus: "disabled", // this is used to suppress the filtering options until the table is rendered

        };

        // bind all event handlers
        this.handleQueryStorage = this.handleQueryStorage.bind( this )
        this.renderTableBody = this.renderTableBody.bind( this )
        this.handleSearchTable = this.handleSearchTable.bind( this )
        this.handleUtilThreshold = this.handleUtilThreshold.bind( this )
        this.handleStackEntity = this.handleStackEntity.bind( this )

    }

    // use the componentDidMount method to set state before render
    // ref: https://reactjs.org/docs/react-component.html#componentdidmount
    // intro to javascript 'promises': https://javascript.info/promise-basics
    // intro to javascript 'async/await': https://javascript.info/async-await
    async componentDidMount(){

        // built the graphQL query to iterate all accounts
        //ref: https://api.newrelic.com/graphiql?#query=%7B%0A%20%20actor%20%7B%0A%20%20%20%20accounts%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A
        const accountsQuery = gql`{ actor { accounts { id name } } }`

        // query accounts and set the 'accounts' variable
        let results = await NerdGraphQuery.query( { query: accountsQuery } )

        // validate NRQL results and handle NULLs
        // http://web.archive.org/web/20161108071447/http://blog.osteele.com/posts/2007/12/cheap-monads/
        let accounts = ( ( ( results || {} ).data || {} ).actor || {} ).accounts || []
        this.setState( { accounts: accounts } )

    }

    // function to query NRQL via graphQL; triggerd on selection of radio button in render
    async handleQueryStorage(e){

        // start by clearing out any orphaned value
        let whereClause = ""

        // set the whereClause value based on the selected radio button
        switch(e){

            // standard mounts points in use per DBA team
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

        // build the base-query to be used for all results
        let tableNrql = `SELECT max(diskUsedPercent) AS 'utilization' FROM StorageSample ${ whereClause } FACET hostname, mountPoint, entityGuid  LIMIT MAX`;

        // build a query for the storage data of an account
        const getStorageData = (accountId) => {
            return gql`{
                actor {
                account(id: ${ accountId }) {
                    storage: nrql(query: "${ tableNrql }", timeout: 30000) {
                    results
                    }
                }
                }
            }`
            }

        // empty the allStorageSamples and accountsFinished to start the progress counter
        await this.setState( { allStorageSamples: [], accountsFinished: 0 } );

        // iterate through all of the objects in 'accounts', and query for the storage details in each
        this.state.accounts.forEach(async (account, i) => {

            // assign the return from grahpQL to 'results'
            let results = await NerdGraphQuery.query( { query: getStorageData( account.id ) } )

            // create a temp placeholder that we'll use to manipulate our return
            let tempStorage = this.state.allStorageSamples

            // validate NRQL results and handle NULLs
            // http://web.archive.org/web/20161108071447/http://blog.osteele.com/posts/2007/12/cheap-monads/
            let storageSamples = ( ( ( ( ( results || {} ).data || {} ).actor || {} ).account || {} ).storage || {} ).results || []

            // iterate through the results and append the objects with account details
            storageSamples.forEach( ( sample ) => {
                // write to console for troubleshooting
                //console.log( sample )

                // append the account details
                sample.accountId = account.id
                sample.accountName = account.name

                // add the massaged samples into the tempStorage object
                tempStorage.push( sample )
            })

            // create a progress counter
            let accountsFin = this.state.accountsFinished

            // increment +1 on each loop
            accountsFin = accountsFin+1

            // set the state of allStorageSamples == our massaged data object; accountsFinished == the +1 counter; and empty the searchStatus state*
            // * this is used to return a full table when we clear the search
            this.setState( {
                    allStorageSamples: tempStorage,
                    accountsFinished: accountsFin,
                    searchStatus: "",
                    searched:[],
                    accountNameInput:"",
                    serverNameInput:"",
                    mountPointNameInput:"",
                    utilThreshold: 0} )

        } )

    }

    // function to handle the search input boxes
    async handleSearchTable(e){

        // check for contents, and set the state relative to the input box to the value on input
        // note using the syntax [e.target.id] allows a dynamic match from the input box id to the literal state name from constructor()
        if( e.target.value != "" &&
            e.target.value !== null &&
            e.target.value !== undefined ){

            await this.setState( { [ e.target.id ]:e.target.value } )

        }else{

            if( [ e.target.id ] == "utilThreshold" ) {

                // if the input box is empty, let's make sure the state matches
                await this.setState( { [ e.target.id ]:0 } )

            } else {

                // if the input box is empty, let's make sure the state matches
                await this.setState( { [ e.target.id ]:"" } )

            }

        }

        // if any of the input boxes or the util slider are in use, let's filter the results
        // note the double pipes ( || ) are equivalent to the "OR" operand
        if( this.state.accountNameInput != "" ||
            this.state.serverNameInput != "" ||
            this.state.mountPointNameInput != "" ||
            this.state.utilThreshold > 0 ){
                console.log("A: ",this.state.accountNameInput,"S: ",this.state.serverNameInput,"M: ",this.state.mountPointNameInput,"U: ",this.stateUtilThreshold)
                // assign the contents of our unfiltered data to 'searchedResults'
                let searchResults = this.state.allStorageSamples

                // filter on 'searched', finding all values where the 'allStorageSamples' data matches the search string
                searchResults = searchResults.filter( ( accountSample ) => accountSample.accountName.toLowerCase().includes( this.state.accountNameInput ) )
                searchResults = searchResults.filter( ( serverSample ) => serverSample.facet[0].toLowerCase().includes( this.state.serverNameInput ) )
                searchResults = searchResults.filter( ( mountPointSample ) => mountPointSample.facet[1].toLowerCase().includes( this.state.mountPointNameInput ) )
                searchResults = searchResults.filter( ( utilSample ) => utilSample.utilization > this.state.utilThreshold )

                // set the contents of 'searched' to the results post-filtering
                this.setState( { searched:searchResults } )

        }

        // if all search boxes are empty, reset the table to default
        // note the double ampersands ( && ) are equivalent to the 'AND' operand
        if( this.state.accountNameInput == "" &&
            this.state.serverNameInput == "" &&
            this.state.mountPointNameInput == "" &&
            this.state.utilThreshold == 0 ){

                // log to console for troubleshooting
                console.log( "input boxes and slider found empty, resetting all search fields" )

                // set the contents of 'searched' the the results pre-filtering
                this.setState( { searched :this.state.allStorageSamples } )

        }

    }

    // function to handle the onClick event for server names in table
    handleStackEntity(e) {

        // make sure our table cell isn't empty
        if( e != "" ){

            // build an object to pass into our method
            const entity = {

                guid: e,
                domain: 'INFRA',
                type: 'HOST',

            };

            // execute the openStackedEntity from the nr1 library to open a side card with server details
            navigation.openStackedEntity(entity);

        }

    }

    // function to create the output table in the render() method
    renderTableBody(e){

        return (
            <Table celled striped id="myTable">

                <Table.Header className="tableHeader">

                    <Table.Row>
                        <Table.HeaderCell>SUB-ACCOUNT</Table.HeaderCell>
                        <Table.HeaderCell>SERVER</Table.HeaderCell>
                        <Table.HeaderCell>MOUNT POINT</Table.HeaderCell>
                        <Table.HeaderCell>UTILIZATION %</Table.HeaderCell>
                    </Table.Row>

                </Table.Header>

                <Table.Body className="tableContents">

                    { /*  iterate through all of the results, adding a single row for each */ }
                    {
                        e.map((mp, i)=>{

                            { /* build a URL to take you to the infra dashboard for the select sub-account */ }
                            let accountUrl = `https://infrastructure.newrelic.com/accounts/${mp.accountId}`

                            return (

                                <Table.Row key={i}>

                                    <Table.Cell><a href={accountUrl} target="_blank">{mp.accountName}</a></Table.Cell>
                                    <Table.Cell className="hostContents" onClick={ () => this.handleStackEntity(mp.facet[2]) }>
                                        <Icon name='chart area' /> {mp.facet[0]}
                                    </Table.Cell>
                                    <Table.Cell>{mp.facet[1]}</Table.Cell>
                                    <Table.Cell>{mp.utilization.toFixed(0)}</Table.Cell>

                                </Table.Row>

                            )

                        })

                    }

                </Table.Body>

            </Table>

        )

    }

    renderSearchRow() {

        return(

            <Stack
                alignmentType={Stack.ALIGNMENT_TYPE.CENTER}

                >

                <StackItem grow>

                    <Stack
                        gapType={Stack.GAP_TYPE.LOOSE}
                        distributionType={Stack.DISTRIBUTION_TYPE.FILL}>

                        <StackItem
                            >
                            <input
                                type="text"
                                id="accountNameInput"
                                onChange={ this.handleSearchTable }
                                value={ this.state.accountNameInput }
                                placeholder="Search Sub-Account Name..."
                                title="Sub-Account Name"
                                disabled={ this.state.searchStatus }>
                            </input>
                        </StackItem>

                        <StackItem>
                            <input
                                type="text"
                                id="serverNameInput"
                                onChange={ this.handleSearchTable }
                                value={ this.state.serverNameInput }
                                placeholder="Search Server Name..."
                                disabled={ this.state.searchStatus }
                                title="Server Name">
                            </input>
                        </StackItem>

                        <StackItem>
                            <input
                                type="text"
                                id="mountPointNameInput"
                                onChange={ this.handleSearchTable }
                                value={ this.state.mountPointNameInput }
                                placeholder="Search Mount Point Name..."
                                disabled={ this.state.searchStatus }
                                title="Mount Point Name">
                            </input>
                        </StackItem>

                        <StackItem>
                        <label>

                            <input
                                id="utilThreshold"
                                type="range"
                                min="0"
                                max="100"
                                value={ this.state.utilThreshold }
                                onChange={ this.handleSearchTable }
                                step="1"
                                disabled={ this.state.searchStatus }>
                            </input>

                            <span
                                id="utilLabel">

                                { this.state.utilThreshold }

                            </span>

                        </label>
                    </StackItem>

                    </Stack>

                </StackItem>

            <StackItem>

                <Stack
                    alignmentType={Stack.ALIGNMENT_TYPE.CENTER}
                    gapType={Stack.GAP_TYPE.LOOSE}>

                    <StackItem>
                        <Button
                            onClick={()=>this.setState({
                                searched:[],
                                accountNameInput:"",
                                serverNameInput:"",
                                mountPointNameInput:"",
                                utilThreshold: 0
                                })}>
                            Reset Search
                        </Button>
                    </StackItem>

                </Stack>

            </StackItem>

        </Stack>


        )

    }

    rendertopRow() {

        return(

            <Stack>

                <StackItem grow>

                    { /* build a radio group from react-radio-group with buttons mapped to the DBA teams */ }
                    <RadioGroup

                        className='radio-group'
                        name="dba-team"
                        onChange={ this.handleQueryStorage }>

                        <div className='radio-option'>
                            <Radio value="db2" />DB2 TEAM
                            <Radio value="sql" />MSSQL TEAM
                            <Radio value="oracle" />ORACLE TEAM
                        </div>

                    </RadioGroup>

                </StackItem>

                <StackItem>

                    { /* build a progress indicator */ }
                    <div className='progress'>

                    { /* build and X/Y counter display */ }
                    { this.state.accountsFinished + "/" + this.state.accounts.length }
                    </div>

                </StackItem>

                <StackItem>

                    { /* keep the spinner spinning until we're done iterating through accounts */ }
                    { this.state.accountsFinished != this.state.accounts.length && this.state.accountsFinished != 0
                        ?
                        <Icon
                            loading name='sync'
                            size='large'
                            color='green'>
                        </Icon>
                        :
                        ""
                    }

                </StackItem>

            </Stack>

        )

    }

    render() {

        // if any of our fitlers are in use, populate the table with the results of the search, otherwise give us the full table
        let e =  this.state.accountNameInput != "" ||
            this.state.serverNameInput !="" ||
            this.state.mountPointNameInput !=""  ||
            this.state.utilThreshold > 0
            ?
            this.state.searched
            :
            this.state.allStorageSamples

        return (

            <div className="wrapper">

                { /* execute the renderTopRow method */ }
                { this.rendertopRow() }

                { /* execute the renderSearchRow method */ }
                { this.renderSearchRow() }

                { /* execute the renderTableBody method */ }
                { this.renderTableBody(e) }

            </div>

        )
    }
}
