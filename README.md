[![New Relic Experimental header](https://github.com/newrelic/open-source-office/raw/master/examples/categories/images/Experimental.png)](https://github.com/newrelic/open-source-office/blob/master/examples/categories/index.md#new-relic-experimental)

# nr1-mountpointutilization-nerdpack

* This repository has been archived. If a new maintainer wants to step forward, contact opensource@newrelic.com. *

<!--
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/newrelic/nr1-infra-geoops-nerdpack?include_prereleases&sort=semver) ![AppVeyor](https://img.shields.io/appveyor/ci/newrelic/nr1-infra-geoops-nerdpack) [![Snyk](https://snyk.io/test/github/newrelic/nr1-infra-geoops-nerdpack/badge.svg)](https://snyk.io/test/github/hospitalrun/hospitalrun-frontend)
-->

## Usage

nr1-mountpointutilization-nerdpack provides a centralized view of mount point utilization statistics collected across all the sub-accounts in your organization.

The intent of this nerdpack is to give an introduction to the creation of nerdlets by showcasing a range of common patterns and provide heavily-commented source files to assist engineers who are not as familiar with React.js

*<<< TO-DO: add redacted screenshot... >>>*
<!--
![Screenshot #1](screenshots/screenshot_01.png)
-->

## Open Source License

This project is distributed under the [Apache 2 license](blob/master/LICENSE).

## What do you need to make this work?

1. [New Relic Infrastructure Agent(s) installed](https://newrelic.com/products/infrastructure) and the related access to [New Relic One](https://newrelic.com/platform).

## Getting started
First, ensure that you have [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [NPM](https://www.npmjs.com/get-npm) installed. If you're unsure whether you have one or both of them installed, run the following command(s) (If you have them installed these commands will return a version number, if not, the commands won't be recognized):

```bash
git --version
npm -v
```

Next, clone this repository and run the following scripts:

```bash
nr1 nerdpack:clone -r https://github.com/newrelic/nr1-mountpointutilization.git
cd nr1-mountpointutilization
nr1 nerdpack:uuid -gf
npm install
npm start
```

Visit https://one.newrelic.com/?nerdpacks=local, navigate to the Nerdpack, and :sparkles:

# Support

New Relic has open-sourced this project. This project is provided AS-IS WITHOUT WARRANTY OR SUPPORT, although you can report issues and contribute to the project here on GitHub.

_Please do not report issues with this software to New Relic Global Technical Support._

## Community

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices. Like all official New Relic open source projects, there's a related Community topic in the New Relic Explorer's Hub. You can find this project's topic/threads here:

https://discuss.newrelic.com/c/build-on-new-relic/nr1-infra-geoops-nerdpack
*(Note: URL subject to change before GA)*

## Issues / Enhancement Requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](issues). Please search for and review the existing open issues before submitting a new issue.

# Contributing

Contributions are welcome (and if you submit a Enhancement Request, expect to be invited to contribute it yourself :grin:). Please review our [Contributors Guide](blob/master/CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource@newrelic.com.
