
//run income events series: return total income
function totalIncome_events(scenario, year){
    let totalIncome=0; 
    const numYears = year- (new Date().getFullYear())
    scenario.event_series.forEach((event) => {
        let eventIncome = event.initialAmount
        

        if(event.inflationAdjustment){ 
            for (let i = 1; i <= numYears; i++) {
                eventIncome = (eventIncome + event.expectedChange) * (1 + scenario.inflation_assumption / 100);
            }
            totalIncome +=eventIncome
        }else{
            totalIncome +=eventIncome+ numYears*event.expectedChange;
        } 
    });
    return totalIncome;
}
 

