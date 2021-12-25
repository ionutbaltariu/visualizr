let json_data;
let selected_x = "new_tests_today";
let selected_y = "new_cases_today";
let x_vals_holder = [];
let y_vals_holder = [];
let selection_options = [];
let data = [];

function updateSelectedXValue() {
    selected_x = document.getElementById("x_values").value;
    x_vals_holder = [];
    json_data.covid_romania.forEach(entry => {
        if (entry != 0 && entry != null) {
            x_vals_holder.push(entry[selected_x]);
        }
    });
    init();
}

function updateSelectedYValue() {
    selected_y = document.getElementById("y_values").value;
    y_vals_holder = [];
    json_data.covid_romania.forEach(entry => {
        if (entry != 0 && entry != null) {
            y_vals_holder.push(entry[selected_y]);
        }
    });
    init();
}

async function onload() {
    try {
        let promiseResponse = (await fetch("http://0.0.0.0:8000/"));
        json_data = await promiseResponse.json();
        selection_options = Reflect.ownKeys(json_data.covid_romania[0]);
        /* delete unusable data in plots */
        selection_options = selection_options.splice(0, selection_options.length - 3);


        selection_options.forEach(option => {
            const splitted = option.replace(/_/g, " ")
            document.getElementById("x_values").innerHTML += `<option value="${option}">${splitted}</option>`;
            document.getElementById("y_values").innerHTML += `<option value="${option}">${splitted}</option>`;
        });

        document.getElementById("x_values").value = selected_x;
        document.getElementById("y_values").value = selected_y;

        json_data.covid_romania.forEach(entry => {
            if (entry != 0 && entry != null) {
                y_vals_holder.push(entry[selected_y]);
            }
        });

        json_data.covid_romania.forEach(entry => {
            if (entry != 0 && entry != null) {
                x_vals_holder.push(entry[selected_x]);
            }
        });

        init();
    } catch (error) {
        alert("Something went wrong while fetching the json.")
        console.log(error);
    }
}

function init() {
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

    /* Three function that change the tooltip when user hover / move / leave a cell */
    const mouseover = function(event, d) {
        tooltip.style("opacity", 1)
    }
    const mousemove = function(event, d) {
        tooltip
            .html(`${selected_x}:${d[selected_x]}<br>${selected_y}:${d[selected_y]}<br>for date:${d["reporting_date"]}`)
            .style("left", (event.x) / 2 + "px")
            .style("top", (event.y) / 2 + "px")
    }
    const mouseleave = function(d) {
        tooltip.style("opacity", 0)
    }

    /* set the dimensions and margins of the graph */
    const margin = {
            top: 10,
            right: 30,
            bottom: 30,
            left: 60
        },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

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
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    /* Add Y axis */
    const y = d3.scaleLinear()
        .domain([0, Math.max(...y_vals_holder)])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    /* Add dots */
    svg.append('g')
        .selectAll("dot")
        .data(json_data.covid_romania)
        .join("circle")
        .attr("cx", function(d) {
            return x(d[selected_x]);
        })
        .attr("cy", function(d) {
            return y(d[selected_y]);
        })
        .attr("r", 1.5)
        .style("fill", "#69b3a2")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

    /* Add axis labels */
    // x axis
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text(selected_x.replace(/_/g, " "));

    // y axis
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", `translate(110)`)
        .text(selected_y.replace(/_/g, " "));

}