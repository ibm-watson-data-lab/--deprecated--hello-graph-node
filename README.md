# hello-graph-node

This sample application illustrates how to use the [experimental Node.js library for IBM Graph](https://github.com/ibm-cds-labs/nodejs-graph) to create a graph, add vertices and edges (ad-hoc and in bulk) and traverse the graph using Gremlin. If you prefer to develop in Java, check out the companion repository [hello-graph-java](https://github.com/ibm-cds-labs/hello-graph-java).

If you are not familiar with IBM Graph concepts take a look at the [Getting started guide](https://ibm-graph-docs.ng.bluemix.net/gettingstarted.html).

#### Create an IBM Graph service instance in Bluemix

Before you can run this sample application you have to create an instance of the [IBM Graph service in Bluemix](https://console.ng.bluemix.net/catalog/services/ibm-graph/). 

> Note: You can try IBM Graph for free with limited storage and API calls. See [pricing plans](https://console.ng.bluemix.net/catalog/services/ibm-graph/) for more details.

The instructions below assume that you have the [Cloud Foundry CLI](https://console.ng.bluemix.net/docs/cli/index.html#cli) installed on your machine. 

* Identify the current Bluemix organization and space
```
$ cf t
 API endpoint:   https://api.ng.bluemix.net (API version: 2.x.y)
 User:           someuser@somedomain
 Org:            someuser_org
 Space:          space_name
```

* Create an IBM Graph service instance and credentials
```
$ cf create-service "IBM Graph" Standard ibm-graph-sample
$ cf create-service-key ibm-graph-sample Credentials-1
```

> These credentials provide you with connectivity information for your IBM Graph service instance in Bluemix.

* Display service credentials
```
$ cf service-key ibm-graph-sample Credentials-1
Getting key Credentials-1 for service instance ibm-graph-sample as ...

{
 "apiURI": "https://ibmgraph-alpha.ng.bluemix.net/f...6",
 "apiURL": "https://ibmgraph-alpha.ng.bluemix.net/f...6/g",
 "username": "e...7",
 "password": "d...4"
}
```

> Take note of these credentials. You will need them to configure the sample application.

####  Download the sample application

```
 $ git clone https://github.com/ibm-cds-labs/hello-graph-node.git
 $ cd hello-graph-node
 $ npm install
```

#### Review and run the sample application

The sample application `hello-graph.js` illustrates how to use the Graph library. To run it specify the service credentials values for `apiURL`, `username` and `password` as command line parameters:

```
$ node hello-graph https://ibmgraph...net/f...6/g e...7 d...4 
```

> Set environment variable `DEBUG` to `hello-graph-node` to display IBM Graph responses

> Set environment variable `DEBUG` to `ibm-graph-client` to display IBM Graph requests and responses

The sample application operates on a temporary graph. To retain the graph when the application terminates add the `keep` parameter:

```
$ node hello-graph https://ibmgraph...net/f...6/g e...7 d...4 keep
 ...
 INFO Open https://console.ng.bluemix.net/data/graphdb/f...6/query?graph=d...a to explore the graph in the IBM Graph web console. If prompted enter your IBM Bluemix credentials.
```

#### Explore the graph interactively in the web console

If you've retained the sample graph after the sample application terminated, you can explore it in the IBM Graph web console by opening the displayed link. If prompted enter your IBM Bluemix credentials.
