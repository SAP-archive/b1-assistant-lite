[![REUSE status](https://api.reuse.software/badge/github.com/SAP-Samples/b1-assistant-lite)](https://api.reuse.software/info/github.com/SAP-Samples/b1-assistant-lite)
[![License: Apache2](https://img.shields.io/badge/License-Apache2-green.svg)](https://opensource.org/licenses/Apache-2.0)
[![Not Maintained](https://img.shields.io/badge/Maintenance%20Level-Not%20Maintained-yellow.svg)](https://gist.github.com/cheerfulstoic/d107229326a01ff0f333a1d3476e068d)


# B1 Assistant Lite
[![SAP](https://i.imgur.com/80Ohjn6.png)](http://cloudplatform.sap.com/)

## Description
A sample [Alexa Skill](https://www.amazon.co.uk/b?ie=UTF8&node=10068517031) to demonstrate the integration between Amazon Echo x SAP Business One. [Full explanation and deployment demonstration on Youtube](https://www.youtube.com/watch?time_continue=925&v=gscFihnxxJk&feature=emb_title)

## Requirements
* [Install the Cloud Foundry CLI](https://developers.sap.com/tutorials/cp-cf-download-cli.html)
* [Learn the Fundamentals of SCP Cloud Foundry](https://developers.sap.com/tutorials/cp-cf-fundamentals.html)
* [Amazon developer account](https://developer.amazon.com/)


## Installation 
### Step 1: Deployment of the Backend
* Download or clone this repository.
* Update the hostname and other parameters on the [MANIFEST](manifest.yml) file.
* From the root directory of this app. Execute:
```sh
$ cf push --random-route
```
At the end of the process, Cloud Platform should return a Route as shown below. We will need it later.
![SAP](https://i.imgur.com/exuU9vu.png)

### Step 2 - Configure the Alexa Skill
* Follow the steps int he [skill](skill/) folder to create your Alexa Skill and have it connected to the SAP Cloud Platform

## Test
<img src="https://i.imgur.com/xkw6lXx.png" alt="drawing" width="600"/>

* You can test your skill from the development console (as shown above)
* Or from your Amazon Device, as long as it is logged with the same account you used on Amazon Developer
* There is also a [Postman Collection](test/Alexa.postman_collection.json) that you can use to test your backend. You can use it against your SAP Cloud Platform app Route OR with a local environment (on your machine) and long as you set the environment variables. Full list of variables available in the [MANIFEST](manifest.yml) file.

## Support and Contributions  
This repository is provided "as-is". With no Warranty or support. Feel free to open issues.

## License
Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSES/Apache-2.0.txt) file.

