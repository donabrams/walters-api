function tile_pieces(json) {
  json.pieces = _.first(json.pieces, 50);
  var x = d3.scale.ordinal().domain([0,1,2,3,4]).rangeBands([0,500], 0.1);
  var y = d3.scale.ordinal().domain(d3.range(0, Math.ceil(json.pieces.length/5))).rangeBands([0,900], 0.1);
  var d = tiles.selectAll('g.tile').data(_.filter(json.pieces, function(d) { return d.thumbnail.width; }), function(d) { return d.id; });
  d.exit().transition().duration(1000).style('opacity', 0).remove();
  d.transition().duration(1000).attr('transform', function(d, i) { return 'translate(' + x(i % 5) + ',' + y(Math.floor(i/5)) + ')'; }).select('image')
    .attr('width', x.rangeBand()).attr('height', y.rangeBand())
  ;
  d.enter().append('g')
    .attr('class', 'tile')
    .attr('piece-id', function(d) { return d.id; })
    .attr('transform', function(d, i) { return 'translate(' + x(i % 5) + ',' + y(Math.floor(i/5)) + ')'; })
    .append('image').attr('xlink:href', function(d) { return d.thumbnail.url; })
    .attr('width', x.rangeBand()).attr('height', y.rangeBand())
    .attr('opacity', 0)
    .transition().duration(1000).style('opacity', 1);
}
function tile_tag(id) {
  d3.json('/tags/' + id + '.json', function(json) {tile_pieces(json);});
}
function tile_location(id) {
  d3.json('/locations/' + id + '.json', function(json) { tile_pieces(json); });
}
var r = 900;
var fill = d3.scale.category20c();
var bubble = d3.layout.pack().sort(null).size([r,r]).value(function(d) { return d.count ? d.count : 0; });

var svg = d3.select('#chart').append('svg').attr('height', r).attr('width', 1400);
var g = svg.append('g').attr('height', r).attr('width', r);
var tiles = svg.append('g').attr('height', r).attr('width', 500).attr('transform', 'translate(900,0)');
svg = g;
function by_tags() {
  svg.selectAll('g').remove();
  d3.json('/tags.json', function(json) {
    var node = svg.selectAll('g.node')
          .data(bubble.nodes({ children: _.sortBy(json, function(d) { return -d.count; }) }).filter(function(d) { return d.count && !d.children; }))
          .enter().append('g')
          .attr('class', 'node')
          .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

    node.append('title')
      .text(function(d) { return d.id + ": " + d.count; });
    node.append('circle')
      .style('fill', function(d) { return fill(d.id); })
      .attr('r', 0)
      .on('click', function(d) { tile_tag(d.id); })
      .transition().duration(1500).ease('bounce')
      .attr('r', function(d) { return d.r; })
    ;
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .text(function(d) { return d.id; })
      .style('opacity', 0)
      .transition().duration(750).style('opacity', 1)
    ;
  });
}
function by_locations() {
  svg.selectAll('g').remove();
  d3.json('/locations.json', function(json) {
    json = _.map(json, function(d) { d.count = 1; return d; });
    var x = d3.scale.ordinal().domain([0,1,2,3,4,5]).rangeBands([0,900], 0.1);
    var y = d3.scale.ordinal().domain(d3.range(0, Math.ceil(json.length/6))).rangeBands([0,900], 0.1);
    var treemap = d3.layout.treemap()
          .size([900, 900])
          .sticky(true)
          .value(function(d) { if (d.children) return 0; return d.count; })
          .sort(function(a,b) { return a.value - b.value; })
    ;
    var d = svg.selectAll('g.node')
          .data(treemap({ children: json }), function(d) { return d.children ? '__museum' : d.id; });
    var node = d.enter().append('g')
          .attr('class', 'node')
          .attr('location-id', function(d) { return d.id; })
          .attr('transform', function(d,i) { return 'translate(' + d.x + ',' + d.y + ')'; });
    ;
    node
      .append('rect').attr('fill', function(d) { return fill(d.id); })
      .attr('width', function(d,i) { return Math.max(0, d.dx - 1); })
      .attr('height', function(d,i) { return Math.max(0, d.dy - 1); })
    ;
    node
      .append('image').attr('xlink:href', function(d) { return d.children ? '' : d.thumbnail.url; })
      .attr('x', 0).attr('y', 0)
      .attr('width', function(d,i) { return Math.max(0, d.dx - 2); })
      .attr('height', function(d,i) { return Math.max(0, d.dy - 2); })
      .on('click', function(d) { !d.children && tile_location(d.id); })
    ;
    _.each(_.filter(json, function(d) { return d.id != '' && !(d.id.match(/^not/)); }), function(loc) {
      d3.json('/locations/' + loc.id + '.json', function(loc_json) {
        _.find(json, function(d) { return d.id == loc_json.id; }).count = loc_json.pieces.length;
        var d = svg.selectAll('g.node')
              .data(treemap({ children: json }), function(d) { return d.children ? '__museum' : d.id; });
        var node = d
              .transition().duration(250)
              .attr('transform', function(d,i) { return 'translate(' + d.x + ',' + d.y + ')'; });
        ;
        node.selectAll('rect')
              .transition().duration(250)
          .attr('width', function(d,i) { return Math.max(0, d.dx - 1); })
          .attr('height', function(d,i) { return Math.max(0, d.dy - 1); })
        ;
        node.selectAll('image')
              .transition().duration(250)
          .attr('width', function(d,i) { return Math.max(0, d.dx - 2); })
          .attr('height', function(d,i) { return Math.max(0, d.dy - 2); })
        ;
      });
    });
  });
}
by_tags();