import { useEffect, useRef } from 'react';
import { useHMSActions } from '@100mslive/react-sdk';
import { getCssText } from '../../../Theme';
import { usePIPWindow } from './usePIPWindow';

export const usePIPChat = () => {
  const hmsActions = useHMSActions();
  const { isSupported, requestPipWindow, pipWindow, closePipWindow } = usePIPWindow();
  const sendFuncAdded = useRef<boolean>();

  useEffect(() => {
    if (document && pipWindow) {
      const style = document.createElement('style');
      style.id = 'stitches';
      style.textContent = getCssText();
      pipWindow.document.head.appendChild(style);
    }
  }, [pipWindow]);

  useEffect(() => {
    if (pipWindow) {
      const chatContainer = pipWindow.document.getElementById('chat-container');
      const selector = pipWindow.document.getElementById('selector') as HTMLSelectElement;
      const sendBtn = pipWindow.document.getElementById('send-btn');
      const pipChatInput = pipWindow.document.getElementById('chat-input') as HTMLTextAreaElement;
      const marker = pipWindow.document.getElementById('marker');

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
              }
              if (messageId) observer.observe(message as Element);
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

      if (sendBtn && hmsActions && pipChatInput && !sendFuncAdded.current) {
        const pipMessages = pipWindow.document.getElementsByClassName('pip-message');
        // @ts-ignore
        [...pipMessages].forEach(message => {
          if (message.id) {
            hmsActions.setMessageRead(true, message.id);
          }
        });

        sendBtn.addEventListener('click', sendMessage);
        pipChatInput.addEventListener('keypress', e => {
          if (e.key === 'Enter') sendMessage();
        });
        sendFuncAdded.current = true;
      }
    } else {
      sendFuncAdded.current = false;
    }
  }, [pipWindow, hmsActions]);

  useEffect(() => {
    return () => {
      pipWindow && closePipWindow();
    };
  }, [closePipWindow, pipWindow]);

  return { isSupported, requestPipWindow, pipWindow };
};
