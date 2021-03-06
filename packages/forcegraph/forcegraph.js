import './forcegraph.html'
import d3 from 'd3';
import {Template} from 'meteor/templating'

Template.ForceGraph.onRendered(function() {
	const template = this;
	const nodes = [];
	const links = [];

	const nothing = () => {};
	const eventHandlers = {
		mouseOverNode: this.data.mouseOverNode || nothing,
		mouseOutNode : this.data.mouseOutNode  || nothing,
		clickNode    : this.data.clickNode     || nothing
	};

	const svg = d3.select(this.find('svg'))
		.attr('viewBox', '0 0 500 500');
	const messageGroup = svg.append('g');

	const force = d3.layout.force()
		.nodes(nodes)
		.links(links)
		.size([500,500])
		.linkStrength(0.1)
		.friction(0.9)
		.linkDistance(300)
		.charge(-30)
		.gravity(0.1)
		.theta(0.8)
		.alpha(0.1);

	let link = svg.selectAll('.link');
	let node = svg.selectAll('.node');

	force.on('tick', () => {
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
	});

	force.start();

	const selection = this.selection;
	const addedNodes = () => {
		links.length = 0;

		// for source in 1 ..< nodeCount (in reverse order)
		for (let source = nodes.length-1; source > 0; source--) {
			// for target 0..< source (in reverse order)
			for (let target = source-1; target>=0; target--) {
				links.push({source, target})
			}
		}

		link = link.data(links);
		node = node.data(nodes);

		link
			.exit()
			.remove();
		link
			.enter()
			.insert('line', '.node')
			.attr('class', 'link');

		node
			.exit()
			.transition()
			.attr('r', 8)
			.transition()
			.attr('r', 0)
			.remove();
		node
			.enter()
			.insert('circle', '.cursor')
			.attr('class', 'node')
			.call(force.drag)
			.attr('r', 0)
			.on('mouseover', function(data) {
				eventHandlers.mouseOverNode(data, d3.select(this));
			})
			.on('mouseout', function(data) {
				eventHandlers.mouseOutNode(data, d3.select(this));
			})
			.on('click', function(data) {
				eventHandlers.clickNode(data);
			})
			.transition()
			.ease('elastic')
			.duration(1000)
			.attr('r', 5);

		force.start();
	};

	const removedNodes = () => {
		links.length = 0;

		// for source in 1 ..< nodeCount (in reverse order)
		for (let source = nodes.length-1; source > 0; source--) {
			// for target 0..< source (in reverse order)
			for (let target = source-1; target>=0; target--) {
				links.push({source, target})
			}
		}

		link = link.data(links);
		node = node.data(nodes);

		link
			.exit()
			.remove();

		node
			.exit()
			.transition()
			.attr('r', 8)
			.transition()
			.attr('r', 0)
			.remove();

		force.start();
	};

	const drawEventCircle = function(event) {
		let source = nodes.find(node => node._id == event.senderId);
		if (typeof source != 'undefined') {
			for (let node of nodes) {
				if (node != source) {
					messageGroup
						.append('circle')
						.classed('message', true)
						.attr('cx', source.x)
						.attr('cy', source.y)
						.attr('opacity', 1)
						.transition()
						.duration(1000)
						.attr('cx', node.x)
						.attr('cy', node.y)
						.attr('opacity', 0)
						.remove()
				}
			}
		}
	};

	this.autorun(() => {
		nodes.length = 0
		this.nodesObserver = Template.currentData().nodeCursor.observe({
			added(module) {
				nodes.push(module);
				addedNodes();
			},
			removed(module) {
				nodes.splice(_.indexOf(nodes, node => node._id == module._id));
				removedNodes();
			}
		});
	});

	this.autorun(() => {
		this.messageObserver = Template.currentData().messageCursor.observe({
			added: drawEventCircle
		});
	});
});

Template.ForceGraph.onDestroyed(function() {
	this.nodesObserver.stop();
	this.messageObserver.stop();
});