import { useEffect } from 'react';
import { useHMSActions } from '@100mslive/react-sdk';
import { usePIPWindow } from './usePIPWindow';

export const usePIPChat = () => {
  const hmsActions = useHMSActions();
  const { isSupported, requestPipWindow, pipWindow, closePipWindow } = usePIPWindow();

  // Panda CSS doesn't require runtime CSS injection
  useEffect(() => {
    // CSS is already compiled at build time
  }, [pipWindow]);

  // @ts-ignore
  useEffect(() => {
    if (pipWindow) {
      const chatContainer = pipWindow.document.getElementById('chat-container');
      const selector = pipWindow.document.getElementById('selector') as HTMLSelectElement;
      const sendBtn = pipWindow.document.getElementById('send-btn');
      const pipChatInput = pipWindow.document.getElementById('chat-input') as HTMLTextAreaElement;
      const marker = pipWindow.document.getElementById('marker');

      marker?.scrollIntoView({ block: 'end' });

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.id) {
              hmsActions.setMessageRead(true, entry.target.id);
            }
          });
        },
        {
          root: chatContainer,
          threshold: 0.8,
        },
      );

      const mutationObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length > 0) {
            const newMessages = mutation.addedNodes;
            newMessages.forEach(message => {
              const messageId = (message as Element)?.id;
              if (messageId === 'new-message-notif') {
                message.addEventListener('click', () =>
                  setTimeout(() => marker?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 0),
                );
              } else if (messageId) observer.observe(message as Element);
            });
          }
        });
      });
      mutationObserver.observe(chatContainer as Node, {
        childList: true,
      });

      const sendMessage = async () => {
        const selection = selector?.value || 'Everyone';
        if (selection === 'Everyone') {
          await hmsActions.sendBroadcastMessage(pipChatInput.value.trim());
        } else {
          await hmsActions.sendGroupMessage(pipChatInput.value.trim(), [selection]);
        }
        pipChatInput.value = '';
        setTimeout(() => marker?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 0);
      };

      if (sendBtn && hmsActions && pipChatInput) {
        const pipMessages = pipWindow.document.getElementsByClassName('pip-message');
        // @ts-ignore
        [...pipMessages].forEach(message => {
          if (message.id) {
            hmsActions.setMessageRead(true, message.id);
          }
        });
        // @ts-ignore
        const sendOnEnter = e => {
          if (e.key === 'Enter') sendMessage();
        };
        sendBtn.addEventListener('click', sendMessage);
        pipChatInput.addEventListener('keypress', sendOnEnter);
        return () => {
          sendBtn.removeEventListener('click', sendMessage);
          pipChatInput.removeEventListener('keypress', sendOnEnter);
          mutationObserver.disconnect();
          observer.disconnect();
        };
      }
    }
  }, [pipWindow, hmsActions]);

  useEffect(() => {
    return () => {
      pipWindow && closePipWindow();
    };
  }, [closePipWindow, pipWindow]);

  return { isSupported, requestPipWindow, pipWindow };
};
