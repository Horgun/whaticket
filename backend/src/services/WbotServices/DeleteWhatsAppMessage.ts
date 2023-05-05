import AppError from "../../errors/AppError";
import GetWbotMessage from "../../helpers/GetWbotMessage";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

const DeleteWhatsAppMessage = async (messageId: string): Promise<Message[]> => {
  const messages = await Message.findAll({
    where: {
      id: messageId
    },
    include: [
      {
        model: Ticket,
        as: "ticket",
        include: ["contact"]
      }
    ]
  });

  if (messages.length === 0) {
    throw new AppError("No message found with this ID.");
  }

  const { ticket } = messages[0];

  const messageToDelete = await GetWbotMessage(ticket, messageId);

  try {
    await messageToDelete.delete(true);
  } catch (err) {
    throw new AppError("ERR_DELETE_WAPP_MSG");
  }
  
  for (let i = 0; i < messages.length; i++){
    await messages[i].update({ isDeleted: true });
  }

  return messages;
};

export default DeleteWhatsAppMessage;
