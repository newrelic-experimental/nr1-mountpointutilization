import React from 'react';
import PropTypes from 'prop-types';
import { TableChart, Stack, StackItem, ChartGroup, LineChart, BarChart } from 'nr1';

export default class MyNerdlet extends React.Component {

    static propTypes = {

        nerdletUrlState: PropTypes.object,
        launcherUrlState: PropTypes.object,
        width: PropTypes.number,
        height: PropTypes.number,

    };

    constructor(props) {

        super(props);
        this.accountId = 1960001; //ent-monitor_cah //1690385; cardinal-health-master
        console.debug("Init props:", this.props); //eslint-disable-line
        this.state = {

            serverName: null,
            mountPoint: null

        };

    }

    componentWillUpdate(props) {

        if( this.props) {

            console.debug("New props", props);

        }

    }

    setMount(inServerName, inMountPoint) {

        this.setState({ serverName: inServerName, mountPoint: inMountPoint })

    }

    render() {

        const{ serverName, mountPoint } = this.state;
        const allMountNrql = `SELECT max(diskUsedPercent) AS 'utilization' FROM StorageSample FACET hostname, mountPoint LIMIT MAX`;
        const mountBarNrql = `SELECT max(diskUsedPercent) AS 'utilization' FROM StorageSample FACET hostname, mountPoint WHERE hostname = '${serverName}' AND mountPoint = '${mountPoint}'`;
        const mountLineNrql = `SELECT max(diskUsedPercent) AS 'utilization' FROM StorageSample FACET hostname, mountPoint WHERE hostname = '${serverName}' AND mountPoint = '${mountPoint}' TIMESERIES AUTO`;

        return (

            <ChartGroup>

                <Stack

                    alignmentType={Stack.ALIGNMENT_TYPE.FILL}
                    directionType={Stack.DIRECTION_TYPE.VERTICAL}
                    distributionType={Stack.DISTRIBUTION_TYPE.FILL_EVENLY}
                    gapType={Stack.GAP_TYPE.EXTRA_LOOSE}>

                    <StackItem>

                        <div className="chart">

                            <TableChart query={allMountNrql} accountId={this.accountId} className="chart" onClickTable={ ( dataE1, row, chart ) => {
                               console.debug([dataE1, row, chart])
                               this.setMount( row.hostname, row.mountPoint )
                            } } />

                        </div>

                    </StackItem>

                    {serverName && mountPoint && <StackItem>

                        <Stack

                            alignmentType={Stack.ALIGNMENT_TYPE.FILL}
                            directionType={Stack.DIRECTION_TYPE.HORIZONTAL}
                            distributionType={Stack.DISTRIBUTION_TYPE.FILL_EVENLY}
                            gapType={Stack.GAP_TYPE.EXTRA_LOOSE}>

                            <StackItem>

                                <div className="chart">

                                    <BarChart accountId={this.accountId} query={mountBarNrql} className="chart"/>

                                </div>


                            </StackItem>

                            <StackItem>

                                <div className="chart">

                                    <LineChart accountId={this.accountId} query={mountLineNrql} className="chart"/>

                                </div>

                            </StackItem>

                        </Stack>

                    </StackItem> }

                </Stack>

            </ChartGroup>

        )

    }
}
