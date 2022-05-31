function verifyArrivalPackage(data){
    data = JSON.parse(data);
    console.log(data)
    if(data["type"] == null || data["to"] == null || data["id"] == null)
    {
        return null; 
    } 
    else
    {
        return data
    }
}

module.exports = verifyArrivalPackage;