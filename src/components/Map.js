import React, { useLayoutEffect, useCallback, useEffect, useRef, useState } from 'react';

import * as d3 from 'd3';
import { legendColor } from 'd3-svg-legend';
import * as topojson from 'topojson';
import ReactTooltip from 'react-tooltip';

const Map = ({ mapData, eduData, }) => {
    const svgRef = useRef();
    const [tooltipContent, setTooltipContent] = useState('');

    const mapWidth = 975;
    const mapHeight = 610;
    // const mapScale = 1300;
    const duration = 2000;

    const minNum = Math.min(...eduData?.map(item => item?.bachelorsOrHigher / 100));
    const maxNum = Math.max(...eduData?.map(item => item?.bachelorsOrHigher / 100));

    // const projection = d3.geoAlbersUsa().scale(mapScale).translate([mapWidth / 2, mapHeight / 2]);
    const path = d3.geoPath()/*.projection(projection)*/;

    const nation = mapData?.objects?.nation;
    const states = mapData?.objects?.states;
    const counties = mapData?.objects?.counties;

    const translateDiagonal = useCallback((option1, option2, option3) =>
        `translate(${mapWidth * (option2 / option3.length)} ${mapHeight * (option2 / option3.length)})`,
        [mapWidth, mapHeight]);

    const translateLongLat = useCallback((option1, option2, option3) =>
        `translate(${option3[option2].getAttribute('originalx')}, ${option3[option2].getAttribute('originaly')})`,
        []);

    // const colorScale = d3.scaleLinear().domain([minNum, maxNum]).range([d3.schemeGreens[9][0], d3.schemeGreens[9][8]]);
    const colorScale = d3.scaleSequential().domain([minNum, maxNum]).interpolator(d3.interpolateGreens);

    useLayoutEffect(() => {
        if (d3) {
            d3.selectAll('#parentG > g')
                .transition()
                .attr('transform', translateDiagonal)
                .transition()
                .duration(duration)
                .attr('transform', translateLongLat);
        }
    }, [translateDiagonal, translateLongLat]);

    const getEducation = useCallback(fips => eduData?.find(item => item.fips === Number(fips))?.bachelorsOrHigher, [eduData]);

    useEffect(() => {
        const svg = d3.select(svgRef.current);

        svg
            .append('g')
            .attr('id', 'legend')
            .attr('class', 'legendLinear')
            .attr('transform', 'translate(680, 50)');

        const legendLinear = legendColor()
            .shapeWidth(30)
            .shapeHeight(12)
            .orient('horizontal')
            .scale(colorScale)
            .labelFormat(d3.format('.0%'))
            .shapePadding(0);

        svg
            .select('.legendLinear')
            .call(legendLinear);
    }, [colorScale]);

    const SvgMap = ({ setTooltipContent }) => <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} ref={svgRef}>
        <path fill='transparent' stroke="#ddd" d={path(topojson.feature(mapData, nation ? nation : {}))} />

        <g id="states">
            {states && topojson.feature(mapData, states, (a, b) => a !== b).features.map((state, i) =>
                <path
                    key={i}
                    id={`state-${i}`}
                    d={path(state)}
                    fill='none'
                    stroke='#fff'
                    strokeLinejoin='round'
                    strokeLinecap='round'
                    originalx={state.geometry.coordinates[0][0][0]}
                    originaly={state.geometry.coordinates[0][0][1]}
                />
            )}
        </g>

        <g id="counties">
            {counties && topojson.feature(mapData, counties, (a, b) => a !== b).features.map((county, i) =>
                <path
                    key={i}
                    id={`county-${i}`}
                    className="county"
                    d={path(county)}
                    data-fips={county.id}
                    data-education={getEducation(county.id)}
                    fill={colorScale(getEducation(county.id) / 100)}
                    // stroke='#eee'
                    // strokeLinejoin='round'
                    // strokeLinecap='round'
                    originalx={county.geometry.coordinates[0][0][0]}
                    originaly={county.geometry.coordinates[0][0][1]}
                    onMouseEnter={() => setTooltipContent(getEducation(county.id))}
                    onMouseLeave={() => setTooltipContent('')}
                    data-tip=""
                />
            )}
        </g>
    </svg>;

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <SvgMap setTooltipContent={setTooltipContent} />
            <ReactTooltip id="tooltip">{tooltipContent}</ReactTooltip>
        </div>
    );
};

export default Map;