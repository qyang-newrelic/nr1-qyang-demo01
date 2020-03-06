import React from 'react';
import { TableChart, LineChart, navigation, PlatformStateContext, NerdGraphQuery } from 'nr1';
//import { TableChart, Stack, StackItem, ChartGroup, LineChart, ScatterChart } from 'nr1';
   
export default class QyangDemo01NerdletNerdlet extends React.Component {
 
    constructor(props) {
        super(props);
        this.accountId = 1971343;    //My New Relic account ID
        this.state = {
            //appId: null,
            //appName: null,
            //office: null,
            fetching: false,
            userList: null
        };

        this.openEntity = this.openEntity.bind(this);
        this.openChart = this.openChart.bind(this);
        this.setOffice = this.setOffice.bind(this);
        this.getUserList = this.getUserList.bind(this);
    }
    

    getUserList(inOffice) 
    {
        console.log("checking user in office:" + inOffice);
        const nrql = `select uniques(USER_ID) as user_id from Log where Office__c = '${inOffice}' since 7 days ago limit 2000`;

        const { fetching} = this.state;
        
        if (fetching) return;
            
        const gql = `{
          actor {
            account(id: ${this.accountId}) {
              nrql(query: "${nrql}") {
                results
              }
            }
          }
        }`;
    
        this.setState({
          fetching: true,
        });
    
        NerdGraphQuery.query({ query: gql })
            .then(res => {
                const results =(((((res || {}).data || {}).actor || {}).account || {}).nrql || {}).results ;
                //const user_id = (results || {}).user_id || [];
                console.log("result=" + JSON.stringify(res));
                var user_list = null ;
                user_list = results.reduce((a,item) => {
                    if (a == null) {
                        a = "'" + item.user_id[0] + "'";
                    } else {
                        a.concat(",'" + item.user_id[0] + "'");
                    }
                    return a;
                },user_list);
                user_list = "(".concat(user_list,")");
                console.log("result=" + user_list);
                this.setState({
                    fetching: false,
                    userList: user_list
              });
            })
            .catch(err => {
                this.setState({
                    fetching: false,
                });
            });
    }
    
    
    setOffice(inOffice) {
        const userList = this.getUserList(inOffice);
        //this.setState({ office: inOffice})
    }

    /*
    render(){
        const { office, appId, appName } = this.state;
        const nrql =  `SELECT count(*) from Log WHERE service_name = 'Salesforce Event Log' AND Office__c IS NOT NULL facet Office__c`;
        const tCountNrql = `SELECT count(*) FROM Log WHERE service_name = 'Salesforce Event Log' AND Office__c = ${office} TIMESERIES`;
        const apdexNrql = `SELECT count(*) FROM Log WHERE service_name = 'Salesforce Event Log' AND Office__c = ${office} TIMESERIES`
        //return the JSX we're rendering
        return (
            <ChartGroup>
                <Stack
                    verticalType={Stack.VERTICAL_TYPE.FILL}
                    directionType={Stack.DIRECTION_TYPE.VERTICAL}
                    gapType={Stack.GAP_TYPE.EXTRA_LOOSE}>
                    <StackItem>
                            <TableChart query={nrql} accountId={this.accountId} className="top-chart" onClickTable={(dataEl, row, chart) => {
                                //for learning purposes, we'll write to the console.
                                console.debug([dataEl, row, chart]) //eslint-disable-line
                                this.setOffice(row.Office__c)
                            }}/>
                    </StackItem>
                    {office && <StackItem>
                        <Stack
                            horizontalType={Stack.HORIZONTAL_TYPE.FILL}
                            directionType={Stack.DIRECTION_TYPE.HORIZONTAL}
                            gapType={Stack.GAP_TYPE.EXTRA_LOOSE}>
                            <StackItem>
                                <LineChart accountId={this.accountId} query={tCountNrql} className="chart"/>
                            </StackItem>
                            <StackItem>
                                <ScatterChart accountId={this.accountId} query={apdexNrql} className="chart"/>
                            </StackItem>
                        </Stack>
                    </StackItem>}
                </Stack>
            </ChartGroup>
        )
    }
    */

    openChart(query) {
        const nerdlet = {
            id: 'wanda-data-exploration.nrql-editor',
            urlState: {
                initialActiveInterface: 'nrqlEditor',
                initialAccountId: this.accountId,
                initialNrqlValue: query,
                isViewingQuery: true,
            },
        };
        navigation.openOverlay(nerdlet);
    }

    openEntity(entityGuid) {
        navigation.openStackedEntity(entityGuid);
    }
 
    render(){
        const {userList } = this.state;
        const style = {
            height: '45vh',
            margin: '20px'
        };
        const nrql =  `SELECT uniqueCount(USER_ID) as '#Users' from Log WHERE service_name = 'Salesforce Event Log' facet Office__c, Country, State, City`;
        // `SELECT count(*) as 'transactions', apdex(duration) as 'apdex', percentile(duration, 99, 90, 70) FROM Log facet appName, entityGuid limit 25`;
        var trxOverT;
        if ( userList != null ) {
           trxOverT = `SELECT percentile(numeric(EFFECTIVE_PAGE_TIME)/1000,50)  FROM Log WHERE EVENT_TYPE = 'LightningPageView' and USER_ID in ${userList} FACET PAGE_CONTEXT,PAGE_APP_NAME, PAGE_URL TIMESERIES`;
           console.log("Query:" + trxOverT);

        } else { 
            trxOverT = `SELECT percentile(numeric(EFFECTIVE_PAGE_TIME)/1000,50) FROM Log WHERE EVENT_TYPE = 'LightningPageView' TIMESERIES`;
        }
        
        //`SELECT percentile(duration, 99, 50)  as 'transactions' FROM Transaction facet appName limit 25 TIMESERIES`;
        //return the JSX we're rendering
        return <PlatformStateContext.Consumer>
          {(platformUrlState) => {
              //console.debug here for learning purposes
              console.debug(platformUrlState); //eslint-disable-line
              const { duration } = platformUrlState.timeRange;
              const since = ` SINCE ${duration/60/1000} MINUTES AGO`;
              return <div style={{height: '100vh'}}>
                  <TableChart style={style} fullWidth={true} accountId={this.accountId}
                    query={nrql + since}
                    onClickTable={(dataEl, row, chart) => {
                        //for learning purposes, we'll write to the console.
                        console.debug("onClickTable", [dataEl, row, chart]) //eslint-disable-line
                        this.setOffice(row.Office__c)
                        //this.openChart(nrql + ` where Office__c = '` + row.Office__c + `'`)
                    }}
                    />
                  <LineChart style={style} fullWidth={true} accountId={this.accountId}
                    query={trxOverT + since}
                    onClickLine={(...args) => {
                        //for learning purposes, we'll write to the console.
                        console.debug("onClickLine", args) //eslint-disable-line
                    }}
                    />
              </div>;
          }}
        </PlatformStateContext.Consumer>;
    }

}
