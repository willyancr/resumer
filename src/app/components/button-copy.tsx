import { IconClipboard } from "@tabler/icons-react";
import React from "react";
import styled from "styled-components";

interface ButtonCopyProps {
  title: string;
  excerpt: string;
  sumary: string;
}

const ButtonCopy = ({ title, excerpt, sumary }: ButtonCopyProps) => {
  const copyToClipboard = (title: string, excerpt: string, summary: string) => {
    navigator.clipboard.writeText(`# ${title}\n\n${excerpt}\n\n${summary}`);
  };
  return (
    <StyledWrapper>
      <button
        className="faq-button ml-2 rounded-md p-1 text-zinc-50 shadow-lg transition-all"
        onClick={() => copyToClipboard(title, excerpt, sumary)}
      >
        <IconClipboard />
        <span className="tooltip">Copy</span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .faq-button {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: none;
    background: rgb(46, 46, 46);
    background: radial-gradient(
      circle,
      rgba(46, 46, 46, 1) 0%,
      rgba(43, 45, 56, 1) 64%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.151);
    position: relative;
  }

  .faq-button:hover svg {
    animation: jello-vertical 0.7s both;
  }
  @keyframes jello-vertical {
    0% {
      transform: scale3d(1, 1, 1);
    }
    30% {
      transform: scale3d(0.75, 1.25, 1);
    }
    40% {
      transform: scale3d(1.25, 0.75, 1);
    }
    50% {
      transform: scale3d(0.85, 1.15, 1);
    }
    65% {
      transform: scale3d(1.05, 0.95, 1);
    }
    75% {
      transform: scale3d(0.95, 1.05, 1);
    }
    100% {
      transform: scale3d(1, 1, 1);
    }
  }

  .tooltip {
    position: absolute;
    top: -20px;
    opacity: 0;
    background-color: #252525;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition-duration: 0.2s;
    pointer-events: none;
    letter-spacing: 0.5px;
  }

  .tooltip::before {
    position: absolute;
    content: "";
    width: 10px;
    height: 10px;
    background-color: #252525;
    background-size: 1000%;
    background-position: center;
    transform: rotate(45deg);
    bottom: -15%;
    transition-duration: 0.3s;
  }

  .faq-button:hover .tooltip {
    top: -40px;
    opacity: 1;
    transition-duration: 0.3s;
  }
`;

export default ButtonCopy;
