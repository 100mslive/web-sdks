import { Component } from 'react';
import ReactDOM from 'react-dom';

const modalRoot = document.getElementById('modal-root');
const mainRoot = document.getElementById('root');

class Modal extends Component {
    constructor(props) {
        super(props);
        this.el = document.createElement('div');
    }

    componentDidMount() {
        this.el.className = "w-screen flex items-center justify-center rounded-lg"
        modalRoot.appendChild(this.el);
        modalRoot.classList = "z-9999";
        mainRoot.classList = "opacity-80";
    }

    componentWillUnmount() {
        modalRoot.removeChild(this.el);
        modalRoot.classList = "-z-10";
        mainRoot.classList = "";
    }

    render() {
        return ReactDOM.createPortal(
            this.props.children,
            this.el
        );
    }
}

export default Modal
