import React from 'react';
import { Stack, StackItem, BlockText,
			NrqlQuery, Spinner, ChartGroup, TableChart, BarChart, LineChart, 
			navigation, PlatformStateContext, NerdGraphQuery } from 'nr1';
   
export default class QyangDemo01NerdletNerdlet extends React.Component {
 
    constructor(props) {
        super(props);
        this.accountId = 1971343;    //My New Relic account ID
		this.nrql_office =  `SELECT uniqueCount(USER_ID) as user_id from Log WHERE service_name = 'Salesforce Event Log' and Office__c is not null FACET Office__c`;
        this.nrql_country =  `SELECT uniqueCount(USER_ID) as user_id from Log WHERE service_name = 'Salesforce Event Log' FACET Country`;
		this.nrql_city =  `SELECT uniqueCount(USER_ID) as user_id from Log WHERE service_name = 'Salesforce Event Log' FACET City`;
		this.nrql_state =  `SELECT uniqueCount(USER_ID) as user_id from Log WHERE service_name = 'Salesforce Event Log' FACET State`;

        this.state = {
            //appId: null,
            //appName: null,
            office: null,
            fetching: false,
            userList: null
        };

        this.openEntity = this.openEntity.bind(this);
        this.openChart = this.openChart.bind(this);
        this.setOffice = this.setOffice.bind(this);
        this.getUserList = this.getUserList.bind(this);
    }
    

    getUserList(nrql,inParam) 
    {
        console.log("checking user in:" + inParam);
        var u_nrql = nrql.replace('uniqueCount', 'uniques') + " limit 2000"; 
		console.log("Query=" + u_nrql);
		
		//`select uniques(USER_ID) as user_id from Log where Office__c = '${inOffice}' since 14 days ago limit 2000`;

        const { fetching} = this.state;
        
        if (fetching) return;
            
        const gql = `{
          actor {
            account(id: ${this.accountId}) {
              nrql(query: "${u_nrql}") {
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
		
        
        //const nrql =  `SELECT count(*) as 'transactions', apdex(duration) as 'apdex', percentile(duration, 99, 90, 70) FROM Transaction facet appName, entityGuid limit 25`;
		
        var trxOverT;
		var pageview;
        if ( userList != null ) {
           trxOverT = `SELECT percentile(numeric(EFFECTIVE_PAGE_TIME)/1000,50)  FROM Log WHERE EVENT_TYPE = 'LightningPageView' and USER_ID in ${userList} FACET PAGE_CONTEXT,PAGE_APP_NAME, PAGE_URL TIMESERIES`;
           pageview = `SELECT count(*)  FROM Log WHERE EVENT_TYPE = 'LightningPageView' and USER_ID in ${userList} FACET PAGE_CONTEXT,PAGE_APP_NAME, PAGE_URL TIMESERIES`;
           console.log("Query:" + trxOverT);

        } else { 
            trxOverT = `SELECT percentile(numeric(EFFECTIVE_PAGE_TIME)/1000,50) FROM Log WHERE EVENT_TYPE = 'LightningPageView' TIMESERIES`;
			pageview = `SELECT count(*)  FROM Log WHERE EVENT_TYPE = 'LightningPageView' FACET PAGE_CONTEXT,PAGE_APP_NAME, PAGE_URL TIMESERIES`;
           
        }
        
        //`SELECT percentile(duration, 99, 50)  as 'transactions' FROM Transaction facet appName limit 25 TIMESERIES`;
        //return the JSX we're rendering
        

                        
        return <PlatformStateContext.Consumer>
          {(platformUrlState) => {
              //console.debug here for learning purposes
              console.debug(platformUrlState); //eslint-disable-line
              const { begin_time, duration, end_time } = platformUrlState.timeRange;
              var since = '';
              if ( duration != null) {
                since = ` SINCE ${duration/60/1000} MINUTES AGO`;
                
              } else {
                since = ` SINCE ${begin_time} UNTIL ${end_time}`;
              }
              
              console.log("time picker: " + since);
              //console.log("QUERY with time picker: " + nrql + since);
              //const since1 = ` SINCE 2 weeks AGO`;
            
				/*
					<StackItem grow={true}>
					<div className="nr1-Box--a">
						<NrqlQuery accountId={this.accountId} query={nrql + since}>
						{({ loading, data, error })  => {
							console.debug("NrqlQuery", [loading, data, error]); //eslint-disable-line
							if (loading) {
								return <Spinner fillContainer />;
							}
							if (error) {
								return <BlockText>{error.message}</BlockText>;
							}
							return <TableChart data={data} fullWidth={false}/>;
						}}
					</NrqlQuery>
					</div>
					</StackItem>
				
				*/
					
              return (<div style={{height: '100vh'}}>
                  <ChartGroup>
				   <Stack horizontalType={Stack.HORIZONTAL_TYPE.LEFT} preview = {false} fullWidth={true}>
					<StackItem>
					<div>
					<BarChart style={style} fullWidth={false} accountId={this.accountId}
						query={this.nrql_office + since}
						onClickBar={(data) => {
                        //for learning purposes, we'll write to the console.
                        console.debug("onClickTable", data) //eslint-disable-line
                        this.getUserList(this.nrql_office + since, data.metadata.name)
                        //this.openChart(nrql + ` where Office__c = '` + row.Office__c + `'`)
                    }}/>					
					</div>
					</StackItem>
					<StackItem>
					<div>
					<BarChart style={style} fullWidth={false} accountId={this.accountId}
						query={this.nrql_city + since}
						onClickBar={(data) => {
                        //for learning purposes, we'll write to the console.
                        console.debug("onClickTable", data) //eslint-disable-line
                        this.getUserList(this.nrql_city + since, data.metadata.name)
                        //this.openChart(nrql + ` where Office__c = '` + row.Office__c + `'`)
                    }}/>					
					</div>
					</StackItem>
					<StackItem>
					<div>
					<BarChart style={style} fullWidth={false} accountId={this.accountId}
						query={this.nrql_country + since}
						onClickBar={(data) => {
                        //for learning purposes, we'll write to the console.
                        console.debug("onClickTable", data) //eslint-disable-line
                        this.getUserList(this.nrql_country + since, data.metadata.name)
                        //this.openChart(nrql + ` where Office__c = '` + row.Office__c + `'`)
                    }}/>					
					</div>
					</StackItem>
					
					</Stack>
				   <Stack horizontalType={Stack.HORIZONTAL_TYPE.LEFT} preview = {false} fullWidth ={true}>
					<StackItem grow={true}>
					<div>
                	    <BlockText>Page Load Time - {userList}</BlockText>
						<LineChart style={style} fullWidth={true} accountId={this.accountId}
							query={trxOverT + since}
							onClickLine={(...args) => {
							//for learning purposes, we'll write to the console.
							console.debug("onClickLine", args) //eslint-disable-line
						}}/>
					</div>
					</StackItem>
					</Stack>
					<Stack horizontalType={Stack.HORIZONTAL_TYPE.LEFT} preview = {false} fullWidth ={true}>
					<StackItem grow={true}>					
					<div >
                	    <BlockText>Page Views - {userList}</BlockText>
						<LineChart style={style} fullWidth={true} accountId={this.accountId}
						query={pageview + since}
						onClickLine={(...args) => {
							//for learning purposes, we'll write to the console.
							console.debug("onClickLine", args) //eslint-disable-line
						}}/>
					</div>
					</StackItem>
					</Stack>
				  </ChartGroup>
              </div>);
          }}
        </PlatformStateContext.Consumer>;
    }



  async loadData() {
    let { entity, selectedPid } = this.props;
    const { sortBy } = this.state;

    // select all of the metrics, but ensure that the first thing we select is the sorted column,
    // since NRQL sorts on the first function in FACET queries.
    
    const nrql = `SELECT count(*) from Log facet USER_ID`;

    const { data } = await NrqlQuery.query({
      accountId: this.accountId,
      query: nrql,
      formatType: 'raw',
    });
    const { facets } = data.raw;
    const tableData = facets.map(facet => {
      return {
        Office: "Reston",
        Users: 1
      };
    });

    this.setState({ tableData });
  }

  
  
  showTable(tableData) {
    const {office} = this.state;

	const COLUMNS = [
		office,
		users
		];
		
	

    if (!tableData) return <Spinner />;

    if (tableData.length == 0) return 'No Process Sample data for this host.';

    return (
      <Table className="table">
          {tableData.map(row => {
            const className = (Office == row.Office) ? 'selected' : '';
            return (
              <TableRow
                key={row.Office}
                className={className}
                onClick={() => this.getUserList(row.office)}>
				
                <TableRowCell className="right">{row.pid}</TableRowCell>
                {COLUMNS.map(column => {
                  return (
                    <TableRowCell className={column.align || 'right'} key={column.id}>
                      {row[column.id]}
                    </TableRowCell>
                  );
                })}
              </TableRow>
            );
          })}
      </Table>
    );
  }


}
