//-------------------------------------------------------------------------------
// Copyright IBM Corp. 2017
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//-------------------------------------------------------------------------------

'use strict';

const async = require('async');
const GDS = require('ibm-graph-client');
const debug = require('debug')('hello-graph-node');
const url = require('url');

const util = require('./lib/util.js');

/*
   Sample application (https://github.com/ibm-cds-labs/hello-graph-node) illustrating how to use 
   the IBM Graph client for Node.js (https://github.com/ibm-cds-labs/nodejs-graph).
   --------------------------------------------------------------------------------
   Debug output for sample application: export DEBUG=hello-graph-node
   Debug output for sample application and IBM Graph client library: export DEBUG=hello-graph-node,ibm-graph-client
 */

debug('Debug is enabled.');

var args = process.argv.slice(2,6);
debug('Command line parameters: ' + JSON.stringify(args));


if(args.length < 3) {
	console.error('Usage: node hello-graph <apiURL> <username> <password> [keep]');
	console.error(' <apiURL>  : required; apiURL value from IBM-Graph service credentials');
	console.error(' <username>: required; username value from IBM-Graph service credentials');
	console.error(' <password>: required; password value from IBM-Graph service credentials');
	console.error(' keep: optional; if specified the sample graph will not be deleted when this sample application terminates');
	process.exit(1);
}

// IBM Graph credentials
const credentials = {
		apiURL: args[0],	
		username: args[1],
		password: args[2]
};

// keep sample graph after this sample application terminates
const keep = ((args.length > 3) && ('keep'.localeCompare(args[3].trim().toLowerCase()) === 0)) ? true : false;

// create Graph Client instance
var graphclient = new GDS(credentials);

/*
  Obtain session token
  API library methods used: 
  	- session()
 */
graphclient.session(function(err, data) {
	if(err) {
		console.error('Error obtaining session token: '  + err);
		process.exit(1);
	}
	// save session token
	graphclient.config.session = data;

	var graphid = null;

	// work with the graph
	async.series([
					function(callback) {
						/*
						  Create new (empty) graph to allow for repeat execution of this sample application
						  API library methods used: 
						  	- graphs().create()
							- graphs().set()						  							  								  
						 */
						console.log('Creating new graph ...'); 
						graphclient.graphs().create(function(err, response) {
							if(err) {
								return callback('Error creating graph: '  + err);
							}

							debug('graphs().create() response: ' + JSON.stringify(response));

							if(response.hasOwnProperty('graphId')) {
								graphid = response.graphId;

								// switch to new graph
								console.log('Switching to new graph ...');
								graphclient.graphs().set(graphid, function(err) {
									if(err) {
										return callback('Error switching to graph ' + graphid + ' : '  + err);		
									}
									return callback(null, 'OK');
								});								
							}
							else {
								return callback('Failed to process IBM Graph response: '  + JSON.stringify(response));
							}

						});
					},
					function(callback) {
						/*
						  Load sample schema from file into graph.
						  Refer to the IBM Graph documentation to learn more about schemas.
						  API library methods used: 
						  	- schema().set()							  
						 */ 
						console.log('Loading sample schema ...'); 						 
						util.loadFile('./sample_data/nxnw_schema.json',
								      function(err, sampleschema) {
							if(err) {
								return callback('Error loading sample schema from file: '  + err);
							}			
							// save schema
							graphclient.schema().set(JSON.parse(sampleschema), 
								 				     function(err, data) {
								if(err) {
									return callback('Error saving sample schema: '  + err);
								}
								debug('schema().set() response: ' + JSON.stringify(data));
								return callback(null, 'OK');
							});
						});
					},
					function(callback) {
						/*
						  create and get a vertex
						  API library methods used: 			  
						  	- vertices().create()	
						  	- vertices().get()							  							
						 */ 
						console.log('Creating vertex...'); 						 
						const vertex = {
								label: 'attendee',
								name: 'John Doe',
								gender: 'male',
								age: 25
						};
						// save vertex in graph
						graphclient.vertices().create(vertex, 
							 				     	  function(err, response) {
							if(err) {
								return callback('Error creating vertex ' + JSON.stringify(vertex) + ': '  + err);
							}
							debug('vertices().create() response: ' + JSON.stringify(response));

							if(response.hasOwnProperty('result') && (response.result.hasOwnProperty('data')) && (response.result.data.length === 1)) {
								// extract vertex id
								var id = response.result.data[0].id;
								// fetch vertex by id using vertices().get() method
								graphclient.vertices().get(id, 
														   function(err, response) {
									if(err) {
										return callback('Error fetching vertex with id ' + id + ': '  + err);
									}
									debug('vertices().get() response: ' + JSON.stringify(response));
									console.log('Got vertex using vertices().get() method');
									return callback(null, 'OK');
								});
							} else {
								return callback('Failed to process IBM Graph response: '  + JSON.stringify(response));
							}
						});
					},
					function(callback) {
						/*
						  Get a vertex and update it
						  API library methods used: 
						  	- gremlin()						  
						  	- vertices().update()
						 */ 
						console.log('Querying graph for vertex...'); 						 
						// Fetch vertex by running a gremlin traversal
						graphclient.gremlin('def g = graph.traversal(); g.V().has("name", "John Doe");', 
							 				function(err, response) {
							if(err) {
								return callback('Error running gremlin g.V().has("name", "John Doe"): '  + err);
							}
							debug('gremlin() response: ' + JSON.stringify(response));

							if(response.hasOwnProperty('result') && (response.result.hasOwnProperty('data')) && (response.result.data.length === 1)) {
								console.log('Got vertex using gremlin traversal.');

								var id = response.result.data[0].id;
								var properties = {
									age: 35
								};
								console.log('Updating vertex...'); 	
								graphclient.vertices().update(id,			// identifies the vertex
															  properties,	// identifies updated properties
															  function(err, response) {
																if(err) {
																	return callback('Error updating vertex with id ' + id + ': '  + err);
																}
																debug('vertices().update() response: ' + JSON.stringify(response));
																console.log('Updated vertex using vertices().update() method');
																return callback(null, 'OK');
															  },
															  'POST' // use PUT to delete existing properties and replace them with the specified properties
								);
							}
							else {
								return callback('Failed to process IBM Graph response: '  + JSON.stringify(response));	
							}
						});
					},
					function(callback) {
						/*
						  Bulk load sample data (up to 10MB) from GraphSON file (use io().graphml() to load GraphML formatted data)
						  API methods used: 
						  	- io().graphson()
						 */ 
						console.log('Loading sample file data ...'); 						 
						util.loadFile('./sample_data/nxnw_dataset.json',
								      function(err, sampledata) {
							if(err) {
								return callback('Error loading sample data from file: '  + err);
							}
							console.log('Bulk loading data into graph ...'); 						 
							// populate graph with data
							graphclient.io().graphson(sampledata, 
								 				      function(err, response) {
								if(err) {
									return callback('Error loading data from file: '  + err);
								}
								debug('io().graphson() response: ' + JSON.stringify(response));
								return callback(null, 'OK');	
							});
						});
					},
					function(callback) {
						/*
						  Create a vertex and edge in bulk using gremlin
						  API library methods used: 
						  	- gremlin()						  
						 */ 
						console.log('Creating vertex and edge using gremlin ...'); 						 
						const gremlin = 'def g=graph.traversal(); def r = []; def a = graph.addVertex("name", "Jane Doe", label, "attendee", "age", 28, "gender", "female"); def b=g.V().hasLabel("band").has("name","Kendrick Lamar").next(); def e = a.addEdge("bought_ticket", b); r << a; r << b; r << e; r;';
						graphclient.gremlin(gremlin, 
								 			function(err, response) {
								if(err) {
									return callback('Error running gremlin ' + gremlin + ' : '  + err);
								}
								debug('gremlin() response: ' + JSON.stringify(response));
								return callback(null, 'OK');	
						});
					},										
					function(callback) {
						/*
						  Traverse the graph using gremlin: identify attendees that purchased tickets to Folk concerts
						  API methods used: 
						  	- io().gremlin()
						 */ 
						const traversal = 'def g=graph.traversal(); g.V().hasLabel("band").has("genre","Folk").in("bought_ticket").values("name");'; 						 
						console.log('Executing graph traversal ' + traversal + ' ...');
						// execute Gremlin
						graphclient.gremlin(traversal, 
							 				function(err, response) {
							if(err) {
								debug('gremlin() response: ' + JSON.stringify(response));
								return callback('Error running gremlin ' + traversal + ' : '  + err);
							}
							debug('gremlin() response: ' + JSON.stringify(response));
							// display results
							if(response.hasOwnProperty('result') && (response.result.hasOwnProperty('data'))) {
								console.log('Found  ' + response.result.data.length + ' Folk performance attendees:');
								response.result.data.forEach(function(attendee) {
									console.log(' ' + attendee);
								});
								return callback(null, 'OK');
							}
							else {
								return callback('Failed to process IBM Graph response: '  + JSON.stringify(response));	
							}						
						});
					}					
					],
					function(err, results) {
						if(err) {
							console.error(err);
							process.exit(1);
						}

						debug('Results: ' + JSON.stringify(results));

						/*
						  Cleanup: Delete graph
						  API methods used: 
						  	- graphs().delete()
						 */
						if(! keep) {
							// delete sample graph
							graphclient.graphs().delete(graphid, function(err) {
								if(err) {
									console.error('Error deleting graph ' + graphid + ': '  + err);		
								}
								else {
									console.log('Graph ' + graphid + ' was deleted.');
									console.log('To retain the graph re-run this application and add the keep parameter:');
									console.log('node app <apiURL> <username> <password> keep');
								}
							});
						}
						else {
							// retain sample graph and display web console link
							var pathelements = url.parse(credentials.apiURL).pathname.split('/');
							if(pathelements.length > 1) {
								var gwc_url = 'https://console.ng.bluemix.net/data/graphdb/' + pathelements[1] + '/query?graph=' + graphid;
								console.log('Open ' + gwc_url + ' to explore the graph in the IBM Graph web console. If prompted enter your IBM Bluemix credentials.');
							}
						}
					});
}); 


