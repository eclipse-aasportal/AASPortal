/******************************************************************************
 * 
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,",
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft",
 * zur Foerderung der angewandten Forschung e.V.",
 * 
 *****************************************************************************/
"use strict";

import { readFileSync } from 'fs';

main();

function main() {
    const commonSummary = read('./reports/common/coverage-summary.json');
    const aasServerSummary = read('./reports/aas-server/coverage-summary.json');
    const aasLibSummary = read('./reports/aas-lib/coverage-summary.json');
    const aasPortalSummary = read('./reports/aas-portal/coverage-summary.json');

    let statementsTotal = commonSummary.total.statements.total +
        aasServerSummary.total.statements.total +
        aasLibSummary.total.statements.total +
        aasPortalSummary.total.statements.total;

    let statementsCovered = commonSummary.total.statements.covered +
        aasServerSummary.total.statements.covered +
        aasLibSummary.total.statements.covered +
        aasPortalSummary.total.statements.covered;

    let branchesTotal = commonSummary.total.branches.total +
        aasServerSummary.total.branches.total +
        aasLibSummary.total.branches.total +
        aasPortalSummary.total.branches.total;

    let branchesCovered = commonSummary.total.branches.covered +
        aasServerSummary.total.branches.covered +
        aasLibSummary.total.branches.covered +
        aasPortalSummary.total.branches.covered;

    let functionsTotal = commonSummary.total.functions.total +
        aasServerSummary.total.functions.total +
        aasLibSummary.total.functions.total +
        aasPortalSummary.total.functions.total;

    let functionsCovered = commonSummary.total.functions.covered +
        aasServerSummary.total.functions.covered +
        aasLibSummary.total.functions.covered +
        aasPortalSummary.total.functions.covered;

    let total = commonSummary.total.lines.total +
        aasServerSummary.total.lines.total +
        aasLibSummary.total.lines.total +
        aasPortalSummary.total.lines.total;

    let covered = commonSummary.total.lines.covered +
        aasServerSummary.total.lines.covered +
        aasLibSummary.total.lines.covered +
        aasPortalSummary.total.lines.covered;

    console.info('=============================== Coverage summary ===============================');
    console.info(`Statements   : ${(statementsCovered / statementsTotal * 100).toFixed(2)}% ( ${statementsCovered}/${statementsTotal} )`);
    console.info(`Branches     : ${(branchesCovered / branchesTotal * 100).toFixed(2)}% ( ${branchesCovered}/${branchesTotal} )`);
    console.info(`Functions    : ${(functionsCovered / functionsTotal * 100).toFixed(2)}% ( ${functionsCovered}/${functionsTotal} )`);
    console.info(`Lines        : ${(covered / total * 100).toFixed(2)}% ( ${covered}/${total} )`);
    console.info('================================================================================');
}

function read(path) {
    return JSON.parse(readFileSync(path).toString());
}
