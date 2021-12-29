let json_data;
let geojson_data;
let selected_x = "new_tests_today";
let selected_y = "new_cases_today";
let x_vals_holder = [];
let y_vals_holder = [];
let selection_options = [];
let will_resize_on_point_click = false;
let will_show_more_details_on_click = true;
let will_show_cases_per_county_map_on_click = true;
let selected_point_counties = {};
let max_county_cases;
let min_county_cases;

/* set the dimensions and margins of the graph */
const margin = {
        top: 10,
        right: 30,
        bottom: 30,
        left: 60
    },
    width = 530 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

function populateYValuesHolder(source) {
    source.forEach(entry => {
        if (entry != 0 && entry != null) {
            y_vals_holder.push(entry[selected_y]);
        }
    });
}

function populateXValuesHolder(source) {
    source.forEach(entry => {
        if (entry != 0 && entry != null) {
            x_vals_holder.push(entry[selected_x]);
        }
    });
}

function updateSelectedXValue() {
    x_vals_holder = [];
    selected_x = document.getElementById("x_values").value;
    populateXValuesHolder(json_data.covid_romania);
    init();
}

function updateSelectedYValue() {
    selected_y = document.getElementById("y_values").value;
    y_vals_holder = [];
    populateYValuesHolder(json_data.covid_romania);
    init();
}

function removeUnderscoresAndCapitalize(source) {
    const lowercase_no_underscores = source.replace(/_/g, " ").toLowerCase();
    return lowercase_no_underscores.charAt(0).toUpperCase() + lowercase_no_underscores.slice(1);
}

function onPointClickResize() {
    will_resize_on_point_click = document.getElementById("resizeOnClickEnabler").checked;
}

function onShowMoreDetailsSwitch() {
    will_show_more_details_on_click = document.getElementById("showMoreDetails").checked;
}

function onShowCasesPerCountyMapSwitch() {
    will_show_cases_per_county_map_on_click = document.getElementById("showCasesPerCountyMap").checked;
}

/* grade 1 function */
function f(a, b, x) {
    return a * x + b;
}

async function onload() {
    try {
        let promiseResponse = (await fetch("http://0.0.0.0:8000/"));
        json_data = await promiseResponse.json();
        selection_options = Reflect.ownKeys(json_data.covid_romania[0]);

        let geojsonPromiseResponse = (await fetch("http://0.0.0.0:8000/romania_map"));
        geojson_data = await geojsonPromiseResponse.json();
        /* delete unusable data in plots */
        selection_options = selection_options.splice(1, selection_options.length - 4);


        selection_options.forEach(option => {
            const splitted = option.replace(/_/g, " ");
            document.getElementById("x_values").innerHTML += `<option value="${option}">${splitted}</option>`;
            document.getElementById("y_values").innerHTML += `<option value="${option}">${splitted}</option>`;
        });

        document.getElementById("x_values").value = selected_x;
        document.getElementById("y_values").value = selected_y;

        populateXValuesHolder(json_data.covid_romania);
        populateYValuesHolder(json_data.covid_romania);

        init();
    } catch (error) {
        alert("Something went wrong while fetching the json.")
        console.log(error);
    }
}

/* function that helps to fit the given county into a color scheme */
function getColorForNumberOfCases(num_of_cases) {
    const domain = max_county_cases - min_county_cases;
    const partition = domain / 5;
    /* 
    the function we use to fit the number of cases 
    into a given interval is a 1st grade mathematical function 
    bind helps in providing the same constants for all calls
    */
    const f_enhanced = f.bind(null, partition, min_county_cases);
    let color;

    if (num_of_cases > f_enhanced(4)) {
        color = '#a50f15';
    } else if (num_of_cases > f_enhanced(2)) {
        color = '#de2d26';
    } else if (num_of_cases > f_enhanced(1)) {
        color = '#fb6a4a';
    } else if (num_of_cases > f_enhanced(1) / 2) {
        color = '#fcae91';
    } else {
        color = '#fee5d9';
    }

    return color
}

function initGeojson() {
    let is_div_enabled = document.getElementById("my_dataviz_geojson").hidden;
    console.log(is_div_enabled);

    if (is_div_enabled) {
        document.getElementById("my_dataviz_geojson").hidden = false;
    }
    //Width and height
    var w = 450;
    var h = 400;
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-5, 0])
        .html(function(event, d) {
            let to_print = `County: ${d.properties.name}`;
            if (selected_point_counties[d.properties.name]) {
                to_print += `<br> Total cases until selected date: ${selected_point_counties[d.properties.name]}`;
            }
            return to_print;
        })

    //Define map projection
    var projection = d3.geoMercator()

    //Define path generator
    var path = d3.geoPath()
        .projection(projection);

    d3.select("#my_dataviz_geojson").selectAll("*").remove();

    //Create SVG element
    var svg = d3.select("#my_dataviz_geojson")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    projection.fitSize([width, height], geojson_data); // adjust the projection to the features

    const onclick = function(d) {
        console.log(d3.select(this).attr("name"));
    }

    const mouseover = function(event, d) {
        d3.select(this)
            .style("opacity", "0.5");
    }

    const mouseout = function(event, d) {
        d3.select(this)
            .style("opacity", "1");
    }

    svg.selectAll("path")
        .data(geojson_data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", function(d) {
            return getColorForNumberOfCases(selected_point_counties[d.properties.name]);
        })
        .attr("name", function(d) {
            return d.properties.name;
        })
        .on("click", onclick)
        .on('mouseover.color', mouseover)
        .on('mouseout.color', mouseout)
        .on('mouseover.tip', tip.show)
        .on('mouseout.tip', tip.hide);

    svg.call(tip);
}

function init() {
    /* 
    on each axis variable change, we remove the points that contain null as either x or y 
    directly from the source 
    */
    let filtered_data = json_data.covid_romania.filter((d) => { return (d[selected_x] !== null) && (d[selected_y] !== null); });

    /* we set the limits of both axis to the maximum of the values of each axis */
    document.getElementById("buttonXlim").value = Math.max(...x_vals_holder);
    document.getElementById("buttonYlim").value = Math.max(...y_vals_holder);
    /* delete whatever was drawn before */
    d3.select("#my_dataviz").selectAll("*").remove();

    /* create a tooltip */
    var tooltip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-5, 0])
        .html(function(event, d) {
            return `${selected_x}:${d[selected_x]}<br>${selected_y}:${d[selected_y]}<br>for date:${d["reporting_date"]}`
        });

    /* Three functions that change the tooltip when user hover / move / leave a cell */
    const mouseover = function(event, d) {}

    const mouseleave = function(d) {}

    const onclick = function(d) {
        d3.select(this).attr("r", 1.5).style("fill", "red");
        const xVal = d3.select(this).attr("x");
        const yVal = d3.select(this).attr("y");
        const index = d3.select(this).attr("index");
        let county_data = json_data.covid_romania[index]["county_data"];

        d3.select(this).attr("r", 1.5).style("border-style", "groove").style("border-width", "5px");
        let stringified = '';
        let fields_to_be_displayed = Reflect.ownKeys(json_data.covid_romania[0]);
        /* delete unusable data in plots */
        fields_to_be_displayed = fields_to_be_displayed.splice(0, selection_options.length - 4);

        fields_to_be_displayed.forEach(option => {
            if (filtered_data[index][option]) {
                stringified += `${removeUnderscoresAndCapitalize(option)} : ${filtered_data[index][option]}<br>`;
            }
        });

        if (will_show_more_details_on_click) {
            document.getElementById("specific_data_placeholder").hidden = false;
            document.getElementById("point_data_placeholder").innerHTML = stringified;
        } else {
            document.getElementById("specific_data_placeholder").hidden = true;
            document.getElementById("point_data_placeholder").innerHTML = '';
        }

        if (will_resize_on_point_click) {
            document.getElementById("buttonXlim").value = xVal;
            document.getElementById("buttonYlim").value = yVal;
            updatePlotX(xVal);
            updatePlotY(yVal);
        }

        /* we do the operations necessary for redrawing the county map */
        if (county_data && will_show_cases_per_county_map_on_click) {
            selected_point_counties = {};
            county_data.forEach(county => {
                selected_point_counties[county["county_name"]] = county["total_cases"];
            });

            const county_with_most_cases = Object.keys(selected_point_counties).reduce(function(a, b) {
                return selected_point_counties[a] > selected_point_counties[b] ? a : b
            });
            const county_with_least_cases = Object.keys(selected_point_counties).reduce(function(a, b) {
                return selected_point_counties[a] < selected_point_counties[b] ? a : b
            });

            max_county_cases = selected_point_counties[county_with_most_cases];
            min_county_cases = selected_point_counties[county_with_least_cases];
            initGeojson();
        } else {
            d3.select("#my_dataviz_geojson").selectAll("*").remove();
        }

        document.getElementById("selected_date").innerHTML = `Selected date: ${filtered_data[index]["reporting_date"]}`;
    }

    /* append the svg object to the body of the page */
    const svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);


    /* Add X axis */
    const x = d3.scaleLinear()
        .domain([0, Math.max(...x_vals_holder)])
        .range([0, width]);
    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    /* Add Y axis */
    const y = d3.scaleLinear()
        .domain([0, Math.max(...y_vals_holder)])
        .range([height, 0]);

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y));

    /* Add dots */
    /* x and y attributes are used for the window resize functionality */
    svg.append('g')
        .selectAll("dot")
        .data(filtered_data)
        .join("circle")
        .attr("x", function(d) {
            return d[selected_x];
        })
        .attr("cx", function(d) {
            return x(d[selected_x]);
        })
        .attr("y", function(d) {
            return d[selected_y];
        })
        .attr("cy", function(d) {
            return y(d[selected_y]);
        })
        .attr('index', function(d, i) { return +i; })
        .attr("r", 1.5)
        .style("fill", "#69b3a2")
        .on("mouseover.color", mouseover)
        .on("mouseover.tip", tooltip.show)
        .on("mouseleave.color", mouseleave)
        .on("mouseleave.tip;", tooltip.hide)
        .on("click", onclick);

    svg.call(tooltip);

    function updatePlotX(xlim) {
        x.domain([0, xlim]);
        xAxis.transition().duration(1000).call(d3.axisBottom(x));
        refitPoints();

    }

    function updatePlotY(ylim) {
        y.domain([0, ylim]);
        yAxis.transition().duration(1000).call(d3.axisLeft(y));
        refitPoints();
    }

    function updatePlotXEvent() {
        const xlim = this.value;
        x.domain([0, xlim]);
        xAxis.transition().duration(1000).call(d3.axisBottom(x));
        refitPoints();
    }

    function updatePlotYEvent() {
        const ylim = this.value;
        y.domain([0, ylim]);
        yAxis.transition().duration(1000).call(d3.axisLeft(y));
        refitPoints();
    }

    function refitPoints() {
        svg.selectAll("circle")
            .data(filtered_data)
            .transition()
            .duration(1000)
            .attr("cx", function(d) { return x(d[selected_x]); })
            .attr("cy", function(d) { return y(d[selected_y]); });
    }

    // Add an event listener to the button created in the html part
    d3.select("#buttonXlim").on("input", updatePlotXEvent);
    d3.select("#buttonYlim").on("input", updatePlotYEvent);
}