import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { modules } from '/imports/Modules';
import d3 from 'd3';
import Chance from 'chance';
const chance = new Chance();

import './main.html';

Template.graph.onCreated(function() {
	this.selection = new ReactiveVar(null);
});

Template.graph.onRendered(function() {
	const svg = d3.select(this.find('svg'))
		.attr('width', 500)
		.attr('height', 500);

	const nodes = [];
	const links = [];

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
	const updateNodes = this.updateNodes = () => {
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
				selection.set(data._id);
				d3.select(this)
					.transition()
					.attr('r', 8)
			})
			.on('mouseout', function() {
				selection.set(null);
				d3.select(this)
					.transition()
					.attr('r', 5)
			})
			.transition()
			.ease('elastic')
			.duration(1000)
			.attr('r', 5);

		force.start();
	};

	allModules = modules.find(
		{},
		{
			fields: {_id: 1},
			transform(module) {
				module.x = randomPosition();
				module.y = randomPosition();
				return module
			}
		}
	);

	observer = allModules.observe({
		added(module) {
			nodes.push(module)
			updateNodes();
		},
		removed(module) {
			nodes.splice(_.indexOf(nodes, node => node._id == module._id));
			updateNodes();
		}
	});

});

Template.graph.helpers({
	selectedModule() {
		const selection = Template.instance().selection.get();
		if (selection != null){
			return modules.findOne(selection)
		}
	}
});

Template.graph.events({
	'click .js-add'() {
		modules.insert({name: chance.name({nationality: 'it'})})
	},
	'click .js-remove'() {
		if (modules.find().count()>0)
			modules.remove(modules.findOne()._id)
	}
});

function randomPosition() { return 200 + Math.floor(Math.random()*101) }