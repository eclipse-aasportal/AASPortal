/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,",
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft",
 * zur Foerderung der angewandten Forschung e.V.",
 *
 *****************************************************************************/

import { readFileSync } from 'fs';

main();

function main() {
    const aasCoreSummary = read('./reports/aas-core/coverage-summary.json');
    const aasServerSummary = read('./reports/aas-node/coverage-summary.json');
    const aasLibSummary = read('./reports/aas-lib/coverage-summary.json');
    const aasPortalSummary = read('./reports/aas-portal/coverage-summary.json');

    const statementsTotal =
        aasCoreSummary.total.statements.total +
        aasServerSummary.total.statements.total +
        aasLibSummary.total.statements.total +
        aasPortalSummary.total.statements.total;

    const statementsCovered =
        aasCoreSummary.total.statements.covered +
        aasServerSummary.total.statements.covered +
        aasLibSummary.total.statements.covered +
        aasPortalSummary.total.statements.covered;

    const branchesTotal =
        aasCoreSummary.total.branches.total +
        aasServerSummary.total.branches.total +
        aasLibSummary.total.branches.total +
        aasPortalSummary.total.branches.total;

    const branchesCovered =
        aasCoreSummary.total.branches.covered +
        aasServerSummary.total.branches.covered +
        aasLibSummary.total.branches.covered +
        aasPortalSummary.total.branches.covered;

    const functionsTotal =
        aasCoreSummary.total.functions.total +
        aasServerSummary.total.functions.total +
        aasLibSummary.total.functions.total +
        aasPortalSummary.total.functions.total;

    const functionsCovered =
        aasCoreSummary.total.functions.covered +
        aasServerSummary.total.functions.covered +
        aasLibSummary.total.functions.covered +
        aasPortalSummary.total.functions.covered;

    const total =
        aasCoreSummary.total.lines.total +
        aasServerSummary.total.lines.total +
        aasLibSummary.total.lines.total +
        aasPortalSummary.total.lines.total;

    const covered =
        aasCoreSummary.total.lines.covered +
        aasServerSummary.total.lines.covered +
        aasLibSummary.total.lines.covered +
        aasPortalSummary.total.lines.covered;

    console.info('=============================== Coverage summary ===============================');
    console.info(
        `Statements   : ${((statementsCovered / statementsTotal) * 100).toFixed(2)}% ( ${statementsCovered}/${statementsTotal} )`,
    );
    console.info(
        `Branches     : ${((branchesCovered / branchesTotal) * 100).toFixed(2)}% ( ${branchesCovered}/${branchesTotal} )`,
    );
    console.info(
        `Functions    : ${((functionsCovered / functionsTotal) * 100).toFixed(2)}% ( ${functionsCovered}/${functionsTotal} )`,
    );
    console.info(`Lines        : ${((covered / total) * 100).toFixed(2)}% ( ${covered}/${total} )`);
    console.info('================================================================================');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function read(path: string): any {
    return JSON.parse(readFileSync(path).toString());
}
