# data-visualization-on-migration
this is a data visualization project on USA migration from 1990 to 2010
It is an interactive visualization of migration data for each state that allows users to find the trend and detail information about the migration in USA. 
We showed the migration trend from three aspects - 
the total population of each state in each year (line chart), 
the migration among the selected state with other states (map), 
and the inflow components (pie chart).

Main data files contains all states inflow and outflow migration according to the tax return population from 1990 to 2010, 
obtained at the following link:
https://www.irs.gov/uac/soi-tax-stats-migration-data


Since each csv represents the outflow or inflow migration data of one state in one year, each state have two data file 
in one year. And there are 21 years’ data. So there are about 2000 data files. Each csv shows the state information, 
the inflow or outflow between other states. 
So firstly, to clean up the data files using Python.
The processing data code is in the /data/processing.


table<year>.cvs : two-dimensions tables for each year, showing the state-state migration number.
statesPopEachYear: a table include the total population of each states and each year.
Zip Code Latitude Longitude City State County CSV: used in conjunction with a US map to determine the latitude and longitude coordinates of cities.
file was downloaded from https://www.gaslampmedia.com/download-zip-code-latitude-longitude-city-state-county-csv/. 




