import * as d3 from 'd3';
import * as topojson from 'topojson';

const EDUCATION_FILE =
    'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json'
const COUNTY_FILE =
    'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json'

// What is this 'Promise' thingy???
Promise.all([d3.json(COUNTY_FILE), d3.json(EDUCATION_FILE)])
    .then((data) => {

        let top = data[0] // topology file

        let edu = data[1] // education data
        /*  
          ////////////////////////////////////////////////////
          // Searching for BUG: expected 3141 to equal 3142 //
          ////////////////////////////////////////////////////
          
          // Show the topology has 3142 elements
          console.log('Number of elements in the topology file: ' + top.objects.counties.geometries.map((d) => {
            return d.id
          }).length)
        
          // Show the education data has 3142 elements
          console.log('Number of elements in the education data file: ' + edu.length)
        
          // For some reason, only when this block is run does a missing value get caught by the choropleth code. 
          // Code triggers choropleth response: 'could not find data for: 1001'
          console.log(edu.find((obj) => {
            // Certain values for fips destroy the map! Why?
            if (obj.fips == 1) {
              return obj
            }
          }))
          //console.log(edu)
        */

        choropleth(data[0], data[1])
    })
    .catch((err) => console.log(err))

// Use CSS z-index: 1 to place above canvas
const tooltip = d3.select('body')
    .append('div')
    .attr('id', 'tooltip')
    .attr('class', 'tooltip')
    .attr('visibility', 'hidden')

const svg = d3.select('body')
    .append('svg')
    .attr('width', 960)
    .attr('height', 600)

svg.append("text")
    .attr('id', 'title')
    .attr("x", 400)
    .attr("y", 12)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("The Title")

svg.append("text")
    .attr('id', 'description')
    .attr("x", 400)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("The Subtitle")

// Color gradient: threshold scale domain is length N, and range length N+1
// RECALL: the full array of values is required to specify the range for a threshold scale.
const intervals = 8
const color = d3
    .scaleThreshold()
    .range(d3.schemePurples[intervals + 1])

// Set the legend x-coordinates on the canvas via the scale range spec
const legendxmin = 650
const legendxmax = 850
const legendy = 20

// Legend
const thickness = 8
const legend = svg
    .append('g')
    .attr('id', 'legend')
    .attr('transform', 'translate(0, 20)')

/////////////////////////////
///// Choropleth ////////////
/////////////////////////////

const path = d3.geoPath()

function choropleth(top, raw) {
    //console.log(raw)
    const education = raw.map((item) => { return item.bachelorsOrHigher })
    const minEdu = d3.min(education)
    const maxEdu = d3.max(education)

    // Recall: the domain for a threshold scale is an array
    // NOTE on d3.range :  The stop value is exclusive; it is not included in the result!
    color.domain(
        d3.range(
            minEdu,
            maxEdu + (maxEdu - minEdu) / (intervals),
            (maxEdu - minEdu) / (intervals)
        )
    )

    // Choropleth 
    // OBS: only 3141 objects created by 
    const geo = topojson.feature(top, top.objects.counties).features
    //console.log(topojson.feature(top, top.objects.counties))
    console.log(geo)
    console.log(geo.length)  // Show geo has 3142 elements
    svg
        .selectAll('path')
        .data(geo)
        .enter()
        .append('path')
        .attr('class', 'county')
        .style('fill', function (d, index) {
            const result = raw.filter(function (elem) {
                return elem.fips === d.id
            })
            if (result[0]) {
                return color(result[0].bachelorsOrHigher)
            }
            else { console.log('could not find data for: ', d.id) }
            return color(0)
        })
        .attr('data-fips', function (d, index) {
            //console.log(index)
            return d.id
        })
        .attr('data-education', function (d) {
            const obj = raw.filter(function (elem) {
                return elem.fips === d.id
            })
            if (obj[0]) {
                //console.log('education level', obj[0].bachelorsOrHigher)
                return obj[0].bachelorsOrHigher
            }
            // could not find a matching fips id in the data
            else { console.log('could not find data for: ', d.id) }
            return 0
        })
        .attr('data-location', (d) => {
            let result = raw.filter(function (elem) {
                return elem.fips === d.id
            })
            if (result[0]) {
                return (
                    result[0]['area_name'] +
                    ', ' +
                    result[0]['state']
                )
            }
            else { console.log('could not find a matching fips' + elem.fips + 'id' + d.id + 'id') }
            return 0
        })
        .attr('d', path)
        // NOTE: To use this.getAttribute, then the () => {} syntax cannot be used (, yet?)
        .on('mouseover', function (event, d) {
            tooltip
                .attr('visibility', 'visible')
                .style('opacity', 0.9)
                .attr('data-education', (d) => { return this.getAttribute('data-education') })
            tooltip
                .html(
                    this.getAttribute('data-location') + ':  ' +
                    this.getAttribute('data-education') + '<br>'
                )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
        })
        .on('mouseout', function () {
            tooltip.style('opacity', 0)
        })

    svg
        .append('path')
        .datum(
            topojson.mesh(top, top.objects.states, function (a, b) {
                return a !== b
            })
        )
        .attr('d', path)
        .attr('class', 'states')


    // Complete legend axis scale
    const legendx = d3
        // The moral of the story is, just use a linear scale for the axis!
        .scaleLinear()
        .domain([minEdu, maxEdu])
        .range([legendxmin, legendxmax])

    let legendAxis = d3
        .axisBottom(legendx)
        .tickSize(13)
        .tickSizeOuter(10)
    legendAxis
        .tickFormat(function (legendx) {
            return Math.round(legendx) + '%'
        })
        .tickValues(color.domain())

    legend
        .append('g')
        .call(legendAxis)
        .attr('font-size', 9)

    // Threshold scale boiler plate - understand threshold.invertExtent()
    const legendData = color.range().map((d) => {
        d = color.invertExtent(d)
        // Boiler plate for threshold scale data
        if (d[0] === undefined) {
            d[0] = 0
        }
        if (d[1] === undefined) {
            d[1] = maxEdu
        }
        return d
    }).slice(1) // Remove extra legend cell from 0 to 1st tick.

    legend
        .selectAll('rect')
        .data(legendData)
        .enter()
        .append('rect')
        .attr('class', 'cell')
        .attr('x', (d) => {
            return legendx(d[0])
        })
        .attr('width', (d, index) => {
            //return d[0] && d[1] ? legendx(d[1]) - legendx(d[0]) : legendx(undefined)}
            return legendx(d[1]) - legendx(d[0])
        })
        .attr('height', thickness)
        .attr('fill', (d) => { return color(d[0]) })
}

