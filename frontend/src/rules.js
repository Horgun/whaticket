const rules = {
	user: {
		static: [
			"tickets-manager:showall",
],
	},

	admin: {
		static: [
			"drawer-admin-items:view",
			"tickets-manager:showall",
			"user-modal:editProfile",
			"user-modal:editQueues",
			"ticket-options:deleteTicket",
			"ticket-options:transferWhatsapp",
			"contacts-page:deleteContact",
		],
	},
};

export default rules;
