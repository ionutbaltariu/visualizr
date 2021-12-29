let json_data;
let selected_x = "new_tests_today";
let selected_y = "new_cases_today";
let x_vals_holder = [];
let y_vals_holder = [];
let selection_options = [];
let will_resize_on_point_click = false;

/* set the dimensions and margins of the graph */
const margin = {
        top: 10,
        right: 30,
        bottom: 30,
        left: 60
    },
    width = 630 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

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

async function onload() {
    try {
        let promiseResponse = (await fetch("http://0.0.0.0:8000/"));
        json_data = await promiseResponse.json();
        selection_options = Reflect.ownKeys(json_data.covid_romania[0]);
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
    var tooltip = d3.select("#my_dataviz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")

    /* Three functions that change the tooltip when user hover / move / leave a cell */
    const mouseover = function(event, d) {
        tooltip.style("opacity", 1);
        d3.select(this).attr("r", 1.5).style("fill", "red");
    }
    const mousemove = function(event, d) {
        tooltip
            .html(`${selected_x}:${d[selected_x]}<br>${selected_y}:${d[selected_y]}<br>for date:${d["reporting_date"]}`)
            .style("left", (event.x) / 2 + "px")
            .style("top", (event.y) / 2 + "px")
    }
    const mouseleave = function(d) {
        tooltip.style("opacity", 0);
        setTimeout(() => {
            d3.select(this)
                .attr("r", 1.5)
                .style("fill", "#69b3a2");
        }, 500);
    }

    const onclick = function(d) {
        const xVal = d3.select(this).attr("x");
        const yVal = d3.select(this).attr("y");
        const index = d3.select(this).attr("index");
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

        document.getElementById("specific_data_placeholder").hidden = false;
        document.getElementById("point_data_placeholder").innerHTML = stringified;
        if (will_resize_on_point_click) {
            document.getElementById("buttonXlim").value = xVal;
            document.getElementById("buttonYlim").value = yVal;
            updatePlotX(xVal);
            updatePlotY(yVal);
        }
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
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", onclick);

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