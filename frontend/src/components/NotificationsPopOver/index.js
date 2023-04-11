import React, { useState, useRef, useEffect, useContext } from "react";

import { useHistory } from "react-router-dom";
import { format } from "date-fns";
import openSocket from "../../services/socket-io";
import useSound from "use-sound";

import Popover from "@material-ui/core/Popover";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles } from "@material-ui/core/styles";
import Badge from "@material-ui/core/Badge";
import ChatIcon from "@material-ui/icons/Chat";

import TicketListItem from "../TicketListItem";
import { i18n } from "../../translate/i18n";
import useTickets from "../../hooks/useTickets";
import alertSound from "../../assets/sound.mp3";
import { AuthContext } from "../../context/Auth/AuthContext";
import { FormControlLabel, FormGroup, Switch } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
	tabContainer: {
		overflowY: "auto",
		maxHeight: 350,
		...theme.scrollbarStyles,
	},
	popoverPaper: {
		width: "100%",
		maxWidth: 350,
		marginLeft: theme.spacing(2),
		marginRight: theme.spacing(1),
		[theme.breakpoints.down("sm")]: {
			maxWidth: 270,
		},
	},
	noShadow: {
		boxShadow: "none !important",
	},
}));

const NotificationsPopOver = () => {
	const classes = useStyles();

	const { user } = useContext(AuthContext);
	const ticketIdUrl = +history.location.pathname.split("/")[2];
	const ticketIdRef = useRef(ticketIdUrl);
	const anchorEl = useRef();
	const [isOpen, setIsOpen] = useState(false);
	const [systemNotifEnabled, setSystemNotifEnabled] = useState(false);
	const [notifications, setNotifications] = useState([]);

	const { tickets } = useTickets({ withUnreadMessages: "true" });
	const [play] = useSound(alertSound);
	const soundAlertRef = useRef();
	const [pageTitle, ] = useState(document.title);

	useEffect(() => {
		soundAlertRef.current = play;
		let storedNotifsEnabled = localStorage.getItem("notifsEnabled");
		if (storedNotifsEnabled === "true"){
			if (("Notification" in window) && Notification.permission === "granted"){
				setSystemNotifEnabled(true);
			}
		}
		
	}, [play]);

	useEffect(() => {
		setNotifications(tickets);
	}, [tickets]);

	useEffect(() => {
		if (notifications.length > 0)
			document.title= `(${notifications.length}) ${pageTitle}`;
		else
			document.title= pageTitle;
	}, [notifications]);

	useEffect(() => {
		ticketIdRef.current = ticketIdUrl;
	}, [ticketIdUrl]);

	useEffect(() => {
		const socket = openSocket();

		socket.on("connect", () => socket.emit("joinNotification"));

		socket.on("ticket", data => {
			if (data.action === "updateUnread" || data.action === "delete") {
				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticketId);
					if (ticketIndex !== -1) {
						prevState.splice(ticketIndex, 1);
						return [...prevState];
					}
					return prevState;
				});

				if (("Notification" in window) && Notification.permission === "granted") {
					navigator.serviceWorker.ready.then((registration) => {
						registration.getNotifications({ tag: `${data.ticketId}` }).then((notifs) => {
							notifs.forEach(notif => {
								notif.close();
							});
						});
					});
				}
			}
			else if (data.action === "update" && data.ticket.status !== "closed" &&
			data.ticket.unreadMessages > 0 &&
			 (data.ticket.userId === user?.id || !data.ticket.userId)) {
				const shouldNotNotificate =
					(data.ticket.id === ticketIdRef.current &&
							document.visibilityState === "visible") ||
					(data.ticket.userId && data.ticket.userId !== user?.id) ||
					data.ticket.isGroup || user.queues.map(q => q.id).indexOf(data.ticket.queueId) === -1;

				if (shouldNotNotificate) return;

				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticket.id);
					if (ticketIndex !== -1) {
						prevState[ticketIndex] = data.ticket;
						return [...prevState];
					}

					return [data.ticket, ...prevState];
				});
			}
		});

		socket.on("appMessage", data => {
			if (
				data.action === "create" &&
				!data.message.read &&
				(data.ticket.userId === user?.id || !data.ticket.userId)
			) {
				const shouldNotNotificate =
					(data.message.ticketId === ticketIdRef.current &&
							document.visibilityState === "visible") ||
					(data.ticket.userId && data.ticket.userId !== user?.id) ||
					data.ticket.isGroup || user.queues.map(q => q.id).indexOf(data.ticket.queueId) === -1;

				if (shouldNotNotificate) return;

				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticket.id);
					if (ticketIndex !== -1) {
						prevState[ticketIndex] = data.ticket;
						return [...prevState];
					}
					return [data.ticket, ...prevState];
				});
				if (systemNotifEnabled)
					handleNotifications(data);
				soundAlertRef.current();
			}
		});

		return () => {
			socket.disconnect();
		};
	}, [user, systemNotifEnabled]);

	const handleNotifications = data => {
		const { message, contact, ticket } = data;

		const options = {
			body: `${message.body} - ${format(new Date(), "HH:mm")}`,
			icon: contact.profilePicUrl,
			tag: ticket.id,
			renotify: true,
		};

		const title = `${i18n.t("tickets.notification.message")} ${contact.name}`;

		if (("Notification" in window) && Notification.permission === "granted") {
			navigator.serviceWorker.ready.then((registration) => {
				registration.showNotification(title, options);
			});
		}
	};

	const handleClick = () => {
		setIsOpen(prevState => !prevState);
	};

	const handleClickAway = () => {
		setIsOpen(false);
	};

	const NotificationTicket = ({ children }) => {
		return <div onClick={handleClickAway}>{children}</div>;
	};

	const handleChangeSystemNotifs = (event) => {
		let checked = event.target.checked;
		let changedState = checked;
		if (checked) {
			if (!("Notification" in window)) {
				console.log("This browser doesn't support notifications");
				changedState = false;
			} else {
				if (Notification.permission === "granted"){
					changedState = true;
				}
				else if (Notification.permission === "default")
					Notification.requestPermission().then((result) => {
						if (result === "granted"){
							changedState = true;
						}
					});
				else if (Notification.permission === "denied"){
					changedState = false;
				}
			}
		}
		else{
			changedState = false;
		}

		localStorage.setItem("notifsEnabled", `${changedState}`);
		setSystemNotifEnabled(changedState);
	};

	return (
		<>
			<IconButton
				onClick={handleClick}
				ref={anchorEl}
				aria-label="Open Notifications"
				color="inherit"
			>
				<Badge badgeContent={notifications.length} color="secondary">
					<ChatIcon />
				</Badge>
			</IconButton>
			<Popover
				disableScrollLock
				open={isOpen}
				anchorEl={anchorEl.current}
				anchorOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				classes={{ paper: classes.popoverPaper }}
				onClose={handleClickAway}
			>
				<FormGroup>
					<FormControlLabel control={<Switch checked={systemNotifEnabled} onChange={handleChangeSystemNotifs} />} 
						label="Enable Notifications" />
				</FormGroup>
				<List dense className={classes.tabContainer}>
					{notifications.length === 0 ? (
						<ListItem>
							<ListItemText>{i18n.t("notifications.noTickets")}</ListItemText>
						</ListItem>
					) : (
						notifications.map(ticket => (
							<NotificationTicket key={ticket.id}>
								<TicketListItem ticket={ticket} />
							</NotificationTicket>
						))
					)}
				</List>
			</Popover>
		</>
	);
};

export default NotificationsPopOver;
