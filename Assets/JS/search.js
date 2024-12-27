window.addEventListener("load", registerSearchRecord, false);

/**
 * Page load function.
 */
async function registerSearchRecord() {
    await client.query(
        `mutation SearchRecord($input: SearchRecordInput!) {
            createSearchTermRecord(input: $input){
                isSuccess
                date
                query
            }
        }`, search_record_data);
}