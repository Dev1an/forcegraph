import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { modules, events } from '/imports/Collections';
import d3 from 'd3';
import Chance from 'chance';
const chance = new Chance();

import './main.html';

let allModules = modules.find(
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

let allEvents = events.find({date: {$gte: new Date()}});

Template.graph.onCreated(function() {
	this.selection = new ReactiveVar(null);
	this.nodes = [];

	let template = this;

	let modulesObserver = allModules.observe({
		added(module) {
			template.nodes.push(module);
			template.updateNodes();
		},
		removed(module) {
			template.nodes.splice(_.indexOf(template.nodes, node => node._id == module._id));
			template.updateNodes();
		}
	});

	let eventObserver = allEvents.observe({
		added(event) {
			template.drawEventCircle(event)
		}
	});

});

Template.graph.onRendered(function() {
	const svg = d3.select(this.find('svg'))
		.attr('width', 500)
		.attr('height', 500);

	const nodes = this.nodes;
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
	this.updateNodes = () => {
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
			.on('click', function(data) {
				events.insert({senderId: data._id, date: new Date()});
			})
			.transition()
			.ease('elastic')
			.duration(1000)
			.attr('r', 5);

		force.start();
	};

	let template = this;

	this.drawEventCircle = function(event) {
		let source = template.nodes.find(node => node._id == event.senderId);
		if (typeof source != 'undefined') {
			for (let node of nodes) {
				if (node != source) {
					svg
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